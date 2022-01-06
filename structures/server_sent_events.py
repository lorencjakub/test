import matplotlib.pyplot as plt
import json
from anastruct import SystemElements, LoadCase, LoadCombination
from root.structures.structure_manager import *
from root.structures.structure_creator import StructureCreator, LoadStructure
from root.distinc_types import JsonDict, Union, StructureMap, LoadsMap,\
    StructureSystem, AnastructLoadCombination
from root.error_handlers import FigureError
from anastruct.basic import FEMException
import re


"""Funkce spouštěné na aktivním SSE kanálu. Zahrnují výpočet a správu souborů uživatelských konstrukcí. """


def calculate_structure(structure_data: dict, time_id: str) -> JsonDict:
    result_pictures, result_tables = dict(), dict()
    invalid_inputs = False
    load_cases, load_combinations = dict(), dict()

    structure_width_from_geometry = max(((max([float(x) for x in structure_data["geometry"]["nodesX"].split(",")]) - min(
        [float(x) for x in structure_data["geometry"]["nodesX"].split(",")])) / 100), 1)
    structure_height_from_geometry = max(((max([float(x) for x in structure_data["geometry"]["nodesY"].split(",")]) - min(
        [float(x) for x in structure_data["geometry"]["nodesY"].split(",")])) / 100), 1)
    structure_width_from_window = 0.8 * structure_data["window"]["width"] / 100
    structure_height_from_window = 0.8 * structure_data["window"]["height"] / 100

    ratio = min(structure_width_from_geometry / structure_height_from_geometry,
                structure_width_from_window / structure_height_from_window)

    figsize = (min((structure_data["window"]["width"] - 137) / 96, 7),
               min(((structure_data["window"]["width"] - 137) / ratio) / 96, 5))

    sc, loads, ss = create_structure(structure_data, time_id, figsize=figsize)
    result_type = [x for x in structure_data["options"] if "type" in x][0] \
        if len([x for x in structure_data["options"] if "type" in x]) != 0 else False

    for load_case in loads.get_load_cases():
        lc = LoadCase(load_case.get_lc_name())

        for nodal_load in load_case.get_nodal_loads():
            eval(f"lc.{nodal_load.get_nodal_load_parameters()}")

        for member_load in load_case.get_member_loads():
            eval(f"lc.q_load({member_load.get_member_load_parameters()})")

        load_cases.update({len(load_cases) + 1: lc})

    if structure_data["loads"]["loadCombinations"] != 0:
        for load_combination in loads.get_load_combinations():
            co = LoadCombination(load_combination.get_co_name())

            for load_case in load_combination.get_factored_lcs():
                lc = [lc[1] for lc in load_cases.items() if lc[0] == load_case[0].get_id()][0]
                co.add_load_case(lc, float(load_case[1]))

            load_combinations.update({len(load_combinations) + 1: co})

            if not invalid_inputs:
                data_list = [ss, structure_data["options"], load_cases, load_combinations, co, time_id, (
                    structure_data["window"]["height"] - 137, structure_data["window"]["width"] - 137), False]

                result_pictures = plot_co_results(
                    *data_list) if not result_type or result_type != "table_type_radio" else {}
                result_tables = create_result_tables(ss, co, time_id) \
                    if not result_type or result_type != "graphic_type_radio" else {}

                data = {**result_pictures, **result_tables}

    else:
        co = LoadCombination("dummy_co")

        for load_case in list(load_cases.values()):
            co.add_load_case(load_case, 1)

            if not invalid_inputs:
                data_list = [ss, structure_data["options"], load_cases, {1: co}, co, time_id, (
                    structure_data["window"]["height"] - 137, structure_data["window"]["width"] - 137), True]

                result_pictures = plot_co_results(
                    *data_list) if not result_type or result_type != "table_type_radio" else {}
                result_tables = create_result_tables(ss, co, time_id) if result_type != "graphic_type_radio" else {}

                data = {**result_pictures, **result_tables}

    if result_pictures or result_tables:
        StructureCreator.restart_counter()
        buttons = get_buttons()
        data["buttons"] = buttons

    elif invalid_inputs:
        data = ("DataError", structure_data)

    else:
        data = ("UnstableError", structure_data)

    yield "data:" + json.dumps(data) + "\n\n"


def create_structure(structure_data: dict, time_hash: str, figsize: tuple = (12, 8))\
        -> Tuple[StructureMap, LoadsMap, StructureSystem]:
    sc, loads = prepare_structure(structure_data)
    ss = SystemElements(figsize=figsize, mesh=int(structure_data["geometry"]["structureFE"]))
    # ss.remove_loads(dead_load=True)

    for member in sc.get_members():
        ss.add_element(**member.get_member_data())
        ss.element_map[member.get_id()].dead_load = 0

    for support in sc.get_supports():
        support_repr = support.get_support_type()
        match = re.search(".(\d, )+\d.", support_repr)\

        if match is not None:
            id_span = match.span()
            id_list = eval(f"{support_repr[id_span[0]:id_span[1]]}")

            for node_id in id_list:
                command = re.sub(".(\d, )+\d.", f"node_id={node_id}", support_repr)
                eval(f"ss.add_support_{command}")

        else:
            eval(f"ss.add_support_{support.get_support_type()}")

    save_temp_structure(time_hash, structure_data)
    ss.show_structure(show=False)
    plt.axis("off")
    plt.savefig(os.getcwd() + f"/root/static/pictures/users/temp/structure{time_hash}.svg", format="svg", bbox_inches=0)

    return sc, loads, ss


def prepare_structure(structure_data: dict) -> Tuple[StructureMap, LoadsMap]:
    sc = StructureCreator(structure_data)

    sc.create_members()
    sc.create_materials()
    sc.create_sections()
    sc.create_supports()

    sc.assign_material_and_section_to_member()
    sc.assign_hinges()

    dead_load = dead_load = [{"id": str(member.get_id()), "self_weight": str(member.get_member_data()["g"])}
                             for member in sc.get_members()]
    loads = LoadStructure(structure_data["loads"]["loadCases"], structure_data["loads"]["loadCombinations"], dead_load)

    return sc, loads


def plot_co_results(ss: StructureSystem, options: dict, load_cases: dict, load_combinations: dict,
                    co: AnastructLoadCombination, time_hash: str, dimensions: tuple,
                    dummy: bool = False) -> Union[dict, bool]:

    try:
        results = co.solve(ss)

    except FEMException:
        return False

    result_pictures = dict()

    for k in list(results.keys()):
        # kombinace neplotují zatížení, jen výsledky
        # members_results = results[k].get_element_results(verbose=True)
        members_results = results[k].get_element_results()
        results_keys = {"N_1": 0, "wmax": 0, "wmin": 0, "u": 0, "Mmin": 0, "Mmax": 0, "Qmin": 0, "Qmax": 0}

        for member in members_results:
            for key in results_keys:
                results_keys[key] += 1 if member[key] != 0 else 0

        results_keys["N"] = results_keys.pop("N_1")

        directory = os.getcwd() + '/root/static/pictures/users/temp'
        path_to_temp = directory[directory.index("static"):]
        load_case = False
        lc_name, lc_number = None, None

        for diagram in list(options.keys())[2:-1]:
            if options[diagram] and is_there_results(diagram, results_keys):
                lc_name = lc_number = None
                # co_name = co_number = None
                title = get_title(diagram)

                if not title:
                    return request_error(FigureError)

                for index, lc in enumerate(list(load_cases.values())):
                    if lc.name == k:
                        lc_name = k
                        lc_number = list(load_cases.values()).index(lc)
                        load_case = True
                        break

                if load_case:
                    eval(f"results[k].show_{diagram.replace('_checkbox', '')}(show=False)")
                    # plt.title(f"{lc_name} - {title}", pad=-20)
                    plt.axis("off")
                    plt.savefig(f"{directory}/lc{lc_number + 1}_{diagram}{time_hash}.svg", format="svg",
                                bbox_inches="tight")

                    with open(f"{directory}/lc{lc_number + 1}_{diagram}{time_hash}.svg", "rb") as xml:
                        picture = xml.read().decode("utf-8")

                    try:
                        dimensions = [round(float(x.split("=")[1].replace('"', "")[:-2]), 0) for x in
                                      picture.split(">\r\n")[2].split(" ") if "height" in x or "width" in x]

                    except ValueError:
                        dimensions = [dimensions[0], dimensions[1]]

                    result_pictures.update({
                        f"{lc_name} - {title}": {
                            "path": f"{path_to_temp}/lc{lc_number + 1}_{diagram}{time_hash}.svg",
                            "height": dimensions[0],
                            "width": dimensions[1]
                        }
                    })

                elif not load_case and diagram != "reaction_force_checkbox" and not dummy:
                    co_number = 0

                    for index, combination in enumerate(list(load_combinations.values())):
                        if combination.name == co.name:
                            # co_name = co.name
                            co_number = list(load_combinations.values()).index(co)
                            break

                    eval(f"results[k].show_{diagram.replace('_checkbox', '')}(show=False)")
                    # plt.title(f"{co_name} - {title}", pad=-20)
                    plt.axis("off")
                    plt.savefig(f"{directory}/co{co_number + 1}_{diagram}{time_hash}.svg", format="svg",
                                bbox_inches="tight")

                    with open(f"{directory}/co{co_number + 1}_{diagram}{time_hash}.svg", "rb") as xml:
                        picture = xml.read().decode("utf-8")

                    try:
                        dimensions = [round(float(x.split("=")[1].replace('"', "")[:-2]), 0) for x in
                                      picture.split(">\r\n")[2].split(" ") if "height" in x or "width" in x]

                    except ValueError:
                        dimensions = [dimensions[0], dimensions[1]]

                    result_pictures.update({
                        f"{co.name} - {title}": {
                            "path": f"{path_to_temp}/co{co_number + 1}_{diagram}{time_hash}.svg",
                            "height": dimensions[0],
                            "width": dimensions[1]
                        }
                    })

                    load_case = False

                else:
                    continue

        if load_case:
            eval(f"results[k].show_structure(show=False)")
            title = get_title("structure")

            if title:
                # plt.title(f"{lc_name} - {title}", pad=-20)
                plt.axis("off")
                plt.savefig(f"{directory}/lc{lc_number + 1}_loads{time_hash}.svg", format="svg", bbox_inches='tight')

                with open(f"{directory}/lc{lc_number + 1}_loads{time_hash}.svg", "rb") as xml:
                    picture = xml.read().decode("utf-8")

                try:
                    dimensions = [round(float(x.split("=")[1].replace('"', "")[:-2]), 0) for x in
                                  picture.split(">\r\n")[2].split(" ") if "height" in x or "width" in x]

                except ValueError:
                    dimensions = [dimensions[0], dimensions[1]]

                result_pictures.update({
                    f"{lc_name} - {title}": {
                        "path": f"{path_to_temp}/lc{lc_number + 1}_loads{time_hash}.svg",
                        "height": dimensions[0],
                        "width": dimensions[1]
                    }
                })

            else:
                return request_error(FigureError)

    return result_pictures


def get_title(diagram: str) -> Union[str, bool]:
    if "axial" in diagram:
        return "Osové síly"

    elif "shear" in diagram:
        return "Posouvající síly"

    elif "bending" in diagram:
        return "Ohybové momenty"

    elif "reaction" in diagram:
        return "Reakce"

    elif "displacement" in diagram:
        return "Deformovaný stav"

    elif "structure" in diagram:
        return "Schéma zatížení"

    else:
        return False


def get_buttons() -> list:
    pdf_button = '<input type="button" id="pdfSave" value="Stáhnout výsledky" onclick="pdfSave();"' \
                 'class="btn btn-secondary rounded m-1">'

    new_button = '<input type= "button" id="nextSection" value="Nová konstrukce" onclick="nextStructure();"' \
                 'class="btn btn-secondary rounded m-1">'

    save_button = '<input type="button" id="structureSave" value="Ulož konstrukci" onclick="structureSave(true);"' \
                  'class="btn btn-secondary rounded m-1">'

    buttons = [pdf_button, save_button, new_button]

    return buttons


def wrong_inputs(status: str) -> JsonDict:
    yield "data:" + status + "\n\n"


def is_there_results(diagram: str, results_keys: dict) -> bool:
    if "axial" in diagram:
        keys = ["N"]

    elif "shear" in diagram:
        keys = ["Qmin", "Qmax"]

    elif "bending" in diagram:
        keys = ["Mmin", "Mmax"]

    elif "displacement" in diagram:
        keys = ["wmax", "wmin", "u"]

    else:
        return True

    results = 0

    for key in keys:
        results += 1 if round(results_keys[key], 3) != 0 else 0

    return True if results != 0 else False


def create_result_tables(ss: StructureSystem, co: AnastructLoadCombination, time_hash: str)\
        -> Union[dict, bool]:

    try:
        results = co.solve(ss)

    except FEMException:
        return False

    result_tables = dict()
    load_case_member_results = dict()

    for k in list(results.keys()):
        all_members_results = results[k].get_element_results(verbose=True)
        # all_nodes_results = results[k].get_node_results_system()
        member_results = {"u": 0, "w": 0, "M": 0, "Q": 0}

        for member in all_members_results:
            for key in [key for key in list(member_results.keys()) if key != "N" and key != "x"]:
                member_results[key] = ["{:.3f}".format(round(x, 3)) for x in list(member[key])]

            axial_forces = []

            for x in range(int(ss.plotter.mesh)):
                axial_forces.append("{:.3f}".format(round(
                    member["N_1"] + x * (member["N_2"] - member["N_1"]) / int(ss.plotter.mesh), 3)))

            member_results["N"] = axial_forces
            member_results["x"] = ["{:.3f}".format(round(0 + x * (member["length"] / int(ss.plotter.mesh)), 3))
                                   for x in range(int(ss.plotter.mesh  ))]
            load_case_member_results[member["id"]] = member_results.copy()

        if k == "combination":
            if co.name != "dummy_co":
                result_tables[co.name] = load_case_member_results.copy()

        else:
            result_tables[k] = load_case_member_results.copy()

    return result_tables
