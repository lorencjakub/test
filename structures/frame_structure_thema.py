from flask import render_template, session, Response
from root import structures
import json
import matplotlib.pyplot as plt
import os
from root.error_handlers import request_error, FigureError

from anastruct import SystemElements, LoadCase, LoadCombination
from root.structures.structure_creator import StructureCreator, LoadStructure

frame_structure_thema = structures.frame_structure_page


@frame_structure_thema.route("/frame_structure_analysis")
def frame_structure_page():
    # stránka pro analýzu 2D prutové konstrukce
    if "user" in session:
        return render_template("frame_structure_calculate_full.html") if session["user"]["username"] == "developerUser"\
                   else render_template("404.html"), 404

    else:
        return render_template("404.html"), 404


@frame_structure_thema.route("/frame_structure_theory")
def structure_theory():
    # stránka pro teorii k prutovým konstrukcím

    return render_template("frame_structure_theory.html")


@frame_structure_thema.route('/structure_calculate_<form_data>', methods=["POST", "GET"])
def structure_progress(form_data):
    structure_data = json.loads(form_data)

    return Response(calculate_structure(structure_data), mimetype='text/event-stream')


def calculate_structure(structure_data):
    sc, loads = prepare_structure(structure_data)
    result_pictures = None
    ss = SystemElements(figsize=(12, 8))

    for member in sc.get_members():
        ss.add_element(**member.get_member_data())
        ss.element_map[member.get_id()].dead_load = 0

    for support in sc.get_supports():
        eval(f"ss.add_support_{support.get_support_type()}")

    load_cases, load_combinations = dict(), dict()

    # --------------------- ROZŠÍŘIT O MOŽNOST, ŽE JSOU POUZE LC A NE CO !!! ------------------------------
    for load_case in loads.get_load_cases():
        lc = LoadCase(load_case.get_lc_name())

        for nodal_load in load_case.get_nodal_loads():
            eval(f"lc.{nodal_load.get_nodal_load_parameters()}")

        for member_load in load_case.get_member_loads():
            eval(f"lc.q_load({member_load.get_member_load_parameters()})")

        load_cases.update({len(load_cases) + 1: lc})

    # --------------------- ROZŠÍŘIT O MOŽNOST, ŽE JSOU POUZE LC A NE CO !!! ------------------------------

    for load_combination in loads.get_load_combinations():
        co = LoadCombination(load_combination.get_co_name())

        for load_case in load_combination.get_factored_lcs():
            lc = [lc[1] for lc in load_cases.items() if lc[0] == load_case[0].get_id()][0]
            co.add_load_case(lc, float(load_case[1]))

        load_combinations.update({len(load_combinations) + 1: co})

        result_pictures = plot_lc_results(ss, structure_data["options"], load_cases, load_combinations, co)

    StructureCreator.restart_counter()

    yield "data:" + json.dumps(result_pictures) + "\n\n"


def prepare_structure(structure_data):
    sc = StructureCreator(structure_data)

    sc.create_members()
    sc.create_materials()
    sc.create_sections()
    sc.create_supports()

    sc.assign_material_and_section_to_member()
    sc.assign_hinges()

    loads = LoadStructure(structure_data["loads"]["loadCases"], structure_data["loads"]["loadCombinations"])

    return sc, loads


def plot_lc_results(ss, options, load_cases, load_combinations, co):
    results = co.solve(ss)
    result_pictures = dict()

    for k in list(results.keys()):
        # kombinace neplotují zatížení, jen výsledky
        directory = os.getcwd() + '/root/static/pictures/users/temp'
        path_to_temp = directory[directory.index("static"):]
        load_case = False
        lc_name, lc_number = None, None

        for diagram in list(options.keys())[2:-1]:
            if options[diagram]:
                lc_name = lc_number = None
                co_name = co_number = None
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
                    plt.title(f"{lc_name} - {title}")
                    plt.savefig(f"{directory}/lc{lc_number + 1}_{diagram}.svg")
                    result_pictures.update({f"{lc_name} - {title}": f"{path_to_temp}/lc{lc_number + 1}_{diagram}.svg"})

                elif not load_case and diagram != "reaction_force_checkbox":
                    for index, combination in enumerate(list(load_combinations.values())):
                        if combination.name == co.name:
                            co_name = co.name
                            co_number = list(load_combinations.values()).index(co)
                            break

                    eval(f"results[k].show_{diagram.replace('_checkbox', '')}(show=False)")
                    plt.title(f"{co_name} - {title}")
                    plt.savefig(f"{directory}/co{co_number + 1}_{diagram}.svg")
                    result_pictures.update({f"{co_name} - {title}": f"{path_to_temp}/co{co_number + 1}_{diagram}.svg"})
                    load_case = False

                else:
                    continue

            else:
                continue

        if load_case:
            eval(f"results[k].show_structure(show=False)")
            title = get_title("structure")

            if title:
                plt.title(f"{lc_name} - {title}")
                plt.savefig(f"{directory}/lc{lc_number + 1}_loads.svg")
                result_pictures.update({f"{lc_name} - {title}": f"{path_to_temp}/lc{lc_number + 1}_loads.svg"})

            else:
                return request_error(FigureError)

    return result_pictures


def get_title(diagram):
    if "axial" in diagram:
        return "Osové síly"

    elif "shear" in diagram:
        return "Posouvající síly"

    elif "bending" in diagram:
        return "Ohybové momenty"

    elif "reaction" in diagram:
        return "reakce"

    elif "displacement" in diagram:
        return "Deformovaný stav"

    elif "structure" in diagram:
        return "Schéma zatížení"

    else:
        return False