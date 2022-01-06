from root.sections.server_validation import return_status as validate_section
from root.distinc_types import Union


class ServerValidation:
    def __init__(self, form_data: dict):
        self.initial_data = form_data
        self.counter = {}

    # v eval() se volá metoda _check... -> get_problems proto nemůže být @staticmethod
    def get_problems(self, parts: Union[list, bool] = False) -> Union[bool, str]:
        if not parts:
            parts = ["nodes", "members", "materials", "load_cases", "load_combinations", "options"]
    
        for part in parts:
            error = eval(f"self._check_{part}()")

            if error:
                return error

        return False

    def _check_nodes(self) -> Union[bool, str]:
        nodes_count = len(self.initial_data["geometry"]["nodesX"].split(","))
        self.counter["nodes"] = nodes_count

        for nodes_setting_number in list(self.initial_data["supports"].keys()):
            if not self.__node_data(self.initial_data["supports"][nodes_setting_number]):
                return "SupportError"

            nodes = self.initial_data["supports"][nodes_setting_number]["nodes"].replace(" ", "").split(",")
            nodes_ids = self.check_elements_ids(nodes, "nodes")

            if isinstance(nodes_ids, str) or max(nodes_ids) > nodes_count:
                return "NodesError"

        self.counter["nodes"] = nodes_count

        return False

    @staticmethod
    def __node_data(data) -> bool:
        keys = list(data.keys())

        if "conditions" not in keys or "nodes" not in keys:
            return False

        elif "stiffness" in keys:
            try:
                if float(data["stiffness"]) <= 0:
                    return False

            except ValueError:
                return False

        elif data["conditions"] == "joint_type" or len(data["conditions"]) == 0 or len(data["conditions"]) == 0:
            return False

        return True

    def _check_members(self) -> Union[bool, str]:
        if len(self.initial_data["geometry"]["allNodesX"].split(",")) % 2 != 0:
            return "MemberError"
    
        members_count = len(self.initial_data["geometry"]["allNodesX"].split(",")) // 2
        self.counter["members"] = members_count

        for member_setting_number in list(self.initial_data["members"].keys()):
            member_setting = self.initial_data["members"][member_setting_number]

            if "crossSection" not in list(member_setting.keys()) or len(member_setting["crossSection"]) == 0:
                return "SectionError"

            section_data = member_setting["crossSection"][1]

            if isinstance(section_data, str):
                section_status = self.section_in_database(section_data)

                return False if section_status == "ok" else "CannotFindSavedSection"

            else:
                section_status = validate_section(section_data, structure=True)
    
            if section_status != "ok":
                return "SectionError"

            members = member_setting["members"].replace(" ", "").split(",")
            members_ids = self.check_elements_ids(members, "members")
    
            if isinstance(members_ids, str) or max(members_ids) > members_count \
                    or member_setting["material"] == "input_name":
                return "MemberError"

        return False

    def check_elements_ids(self, elements: Union[dict, str], part: str, elements_count=False) -> Union[list, str]:
        if len(elements) == 0:
            return "ElementError"

        elements = elements.replace(" ", "").split(",") if isinstance(elements, str) else elements
        elements_ids = []
    
        for element in elements:
            try:
                if "-" in element:
                    if len(element.split("-")) > 2:
                        return "ElementError"

                    else:
                        elements_ids.extend(range(int(element.split("-")[0]), int(element.split("-")[1]) + 1))
    
                else:
                    elements_ids.append(int(element))
    
            except ValueError:
                return "ElementError"
    
        for element_id in elements_ids:
            if element_id < 1:
                return "ElementError"

        if elements_count:
            self.counter[part] = elements_count

        if max(elements_ids) > self.counter[part]:
            return f"{(part[0].upper() + part[1:])}Error"
    
        return list(set(elements_ids))

    def _check_materials(self) -> Union[bool, str]:
        if "materials" in list(self.initial_data.keys()):
            self.counter["materials"] = len(list(self.initial_data["materials"].keys()))

            for material_number in list(self.initial_data["materials"].keys()):
                material = self.initial_data["materials"][material_number]

                try:
                    if float(material["young"]) <= 0 or float(material["weight"]) <= 0:
                        return "MaterialError"

                except ValueError:
                    return "MaterialError"

                if len(material["name"]) == 0:
                    return "MaterialError"

        else:
            try:
                if float(self.initial_data["young"]) <= 0 or float(self.initial_data["weight"]) <= 0:
                    return "MaterialError"

            except ValueError:
                return "MaterialError"

            if len(self.initial_data["name"]) == 0:
                return "MaterialError"

        return False

    def _check_load_cases(self) -> Union[bool, str, list]:
        self.counter["load_cases"] = len(list(self.initial_data["loads"]["loadCases"].keys()))
        dead_load_cases = 0

        for lc_number in list(self.initial_data["loads"]["loadCases"].keys()):
            loads = self.initial_data["loads"]["loadCases"][lc_number]

            if len(loads["name"]) == 0 or loads["loads"] is None or (loads["loads"]["nodal_loads"] == {} and
                                                                     loads["loads"]["member_loads"] == {} and
                                                                     not loads["selfWeight"]):
                return "LCError"

            dead_load_cases += 1 if loads["selfWeight"] else 0

            nodal_loads = loads["loads"]["nodal_loads"]
            member_loads = loads["loads"]["member_loads"]

            for member_load_number in list(member_loads.keys()):
                load_problem = self.__load_data_problem(member_loads[member_load_number], "members")

                if load_problem:
                    return load_problem

            for nodal_load_number in list(nodal_loads.keys()):
                load_problem = self.__load_data_problem(nodal_loads[nodal_load_number], "nodes")

                if load_problem:
                    return load_problem

        if dead_load_cases > 1:
            return "LCError"

        return False

    def __load_data_problem(self, load: dict, part: str) -> Union[bool, str]:
        if "Error" in self.check_elements_ids(load[part], part) \
                or (part == "nodes" and load["loadType"] == "input_name")\
                or (part == "members" and load["direction"] == "load_direction"):
            return f"{part[0].upper()}LoadsError"

        inputs = [load[load_input] for load_input in list(load.keys())
                  if load[load_input] is not None and len(load[load_input]) == 0]

        for load_input in inputs:
            try:
                float(load_input)

            except ValueError:
                return f"{part[0].upper()}LoadsError"

        return False

    def _check_load_combinations(self) -> Union[bool, str]:
        if self.initial_data["loads"]["loadCombinations"] == 0:
            self.counter["load_combinations"] = 0

            return False

        self.counter["load_combinations"] = len(list(self.initial_data["loads"]["loadCombinations"].keys()))

        for co_number in list(self.initial_data["loads"]["loadCombinations"].keys()):
            combination = self.initial_data["loads"]["loadCombinations"][co_number]

            if len(combination["name"]) == 0 or combination["loads"] == {}:
                return "COError"

            for lc_number in list(combination["loads"].keys()):
                try:
                    float(combination["loads"][lc_number]["factor"])

                except ValueError:
                    return "COError"

        return False

    def _check_options(self) -> Union[bool, str]:
        if len(self.initial_data["options"]["iterations"]) == 0:
            self.initial_data["options"]["iterations"] = 100

        try:
            if int(self.initial_data["options"]["iterations"]) < 1:
                return "OptionsError"

        except ValueError:
            return "OptionsError"

        active_checkboxes = [checkbox for checkbox in list(self.initial_data["options"].keys())
                             if self.initial_data["options"][checkbox]
                             and "linear" not in checkbox and checkbox != "iterations"]

        if len(active_checkboxes) == 0:
            return "OptionsError"

        return False

    @staticmethod
    def section_in_database(section_data):
        from root.sections.models import SectionFiles
        from root.error_handlers import db_error
        import re

        section_id = re.findall("\d+", section_data)[0]

        try:
            filenames = "ok" \
                if len(SectionFiles.query.filter(SectionFiles.filename.like(f"%{section_id}%")).all()) != 0 \
                else False

        except AttributeError:
            return db_error()

        return filenames
