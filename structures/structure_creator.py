from root.sections.server_sent_events import frame_section
from root.distinc_types import Tuple, Optional, Union
from .server_validation import ServerValidation


class StructureCreator:
    """StructureCreator object does help to create class anaStruct object. At your service!"""

    __ITERABLE_NODES = int()

    def __init__(self, structure_data: dict = False) -> None:
        if structure_data:
            self.restart_counter()
            self.__MEMBERS, self.__SECTIONS, self.__MATERIALS, self.__SUPPORTS, self.__HINGES = [], [], [], [], []
            self.__structure_data = structure_data

            try:
                self.__NODES = StructureCreator.__set_iterable_nodes(self.__structure_data["geometry"])
                self.__supported_nodes = self.__set_supported_nodes(self.__structure_data["geometry"])

            except:
                raise

    def __str__(self) -> str:
        return f"This StructureCreator contains some data"

    @classmethod
    def get_count_of_nodes(cls):
        return cls.__ITERABLE_NODES

    @classmethod
    def __set_iterable_nodes(cls, geometry: dict) -> list:
        all_nodes_x, all_nodes_y = geometry["allNodesX"].split(","), geometry["allNodesY"].split(",")

        cls.__ITERABLE_NODES = len(all_nodes_x) - 1 if len(all_nodes_x) % 2 == 1 else len(all_nodes_x)
        y_offset = max([float(y) / 100 for y in all_nodes_y])

        return list(zip([float(x) / 100 for x in all_nodes_x], [-1 * float(y) / 100 + y_offset for y in all_nodes_y]))

    @staticmethod
    def __set_supported_nodes(geometry: dict) -> list:
        nodes_x, nodes_y = geometry["nodesX"].split(","), geometry["nodesY"].split(",")
        y_offset = max([float(y) / 100 for y in nodes_y])
        return list(zip([float(x) / 100 for x in nodes_x], [-1 * float(y) / 100 + y_offset for y in nodes_y]))

    def create_members(self) -> None:
        self.__MEMBERS = []

        for i in range(1, StructureCreator.__ITERABLE_NODES, 2):
            nodes = {
                "start_x": self.__NODES[i - 1][0],
                "start_y": self.__NODES[i - 1][1],
                "end_x": self.__NODES[i][0],
                "end_y": self.__NODES[i][1]
            }

            member = MyMember()
            member.create_geometry(**nodes)
            self.__MEMBERS.append(member)

    def create_materials(self) -> None:
        self.__MATERIALS = []
        materials = [values for key, values in self.__structure_data["materials"].items()]

        for m in materials:
            self.__MATERIALS.append(MyMaterial(**m))

    def create_sections(self) -> None:
        self.__SECTIONS = []
        sections = [values for key, values in self.__structure_data["members"].items()]

        for s in sections:
            members_ids = ServerValidation("").check_elements_ids(
                s["members"], "members", elements_count=len(self.__MEMBERS))

            data = {
                "name": s["crossSection"][0],
                "section_data": s["crossSection"][1],
                "material": int(s["material"]),
                "members": members_ids
            }
            self.__SECTIONS.append(MySection(**data))

    def create_supports(self) -> None:
        self.__SUPPORTS = []
        supports = [value for key, value in self.__structure_data["supports"].items() if "support" in value.values()]

        for s in supports:
            nodes_ids = ServerValidation("").check_elements_ids(
                s["nodes"], "nodess", elements_count=len(self.__NODES))
            data = {
                "element": s["element"],
                "conditions": s["conditions"],
                "nodes": nodes_ids
            }

            try:
                data.update({"stiffness": s["stiffness"]})

            except KeyError:
                pass

            self.__SUPPORTS.append(MySupport(**data))

    def assign_material_and_section_to_member(self) -> None:
        for section in self.__SECTIONS:
            for material in self.__MATERIALS:
                if section.get_material_id() == material.get_id():
                    material_properties = [float(material.get_young()), float(material.get_weight())]
                    section.set_material_to_section(*material_properties)

                else:
                    continue

        for section in self.__SECTIONS:
            members = section.get_members()

            for member_id in members:
                for member in self.__MEMBERS:
                    if member.get_id() == member_id:
                        member.set_properties(*section.get_properties()[2:])

                    else:
                        continue

    def assign_hinges(self) -> None:
        hinges = [support for support in self.__structure_data["supports"].values() if "joint" in support.values()]

        for hinge in hinges:
            self.__HINGES.append(MyHinge(**hinge))

        for hinge in self.__HINGES:
            members = hinge.get_properties()[2]

            for member_id in [int(x) for x in members]:
                for member in self.__MEMBERS:
                    if member.get_id() == member_id:
                        member.set_hinges(hinge.get_properties()[1], hinge.get_properties()[-1])

    def get_members(self) -> list:
        return self.__MEMBERS

    def get_supports(self) -> list:
        return self.__SUPPORTS

    @classmethod
    def restart_counter(cls) -> None:
        cls.__ITERABLE_NODES = 0
        StructureElement.restart_counter()
        MyLoadCase.restart_counter()
        MyLoadCombination.restart_counter()


class StructureElement:
    _MEMBERS_COUNT = 0
    _MATERIALS_COUNT = 0
    _SECTIONS_COUNT = 0
    _SUPPORTS_COUNT = 0
    _HINGES_COUNT = 0

    def __init__(self, element: str = False) -> None:
        if element:
            self._id = StructureElement.__add_new_element(element.upper())

    @classmethod
    def __add_new_element(cls, element: str) -> int:
        if element == "MEMBER":
            cls._MEMBERS_COUNT += 1
            return cls._MEMBERS_COUNT

        elif element == "MATERIAL":
            cls._MATERIALS_COUNT += 1
            return cls._MATERIALS_COUNT

        elif element == "SECTION":
            cls._SECTIONS_COUNT += 1
            return cls._SECTIONS_COUNT

        elif element == "SUPPORT":
            cls._SUPPORTS_COUNT += 1
            return cls._SUPPORTS_COUNT

        elif element == "HINGE":
            cls._HINGES_COUNT += 1
            return cls._HINGES_COUNT

        else:
            raise ValueError("Unexpected object!")

    @classmethod
    def get_count_of_element(cls, element: str) -> int:
        return eval(f"cls._{element.upper()}_COUNT")

    def get_id(self) -> int:
        return self._id

    @classmethod
    def restart_counter(cls) -> None:
        cls._MEMBERS_COUNT = 0
        cls._MATERIALS_COUNT = 0
        cls._SECTIONS_COUNT = 0
        cls._SUPPORTS_COUNT = 0
        cls._HINGES_COUNT = 0


class MyMember(StructureElement):
    def __init__(self) -> None:
        super().__init__(self.__class__.__name__[2:])
        self.__nodes, self.__section_data = None, None
        self.__hinges = {
            1: 0,
            2: 0
        }

    def __str__(self) -> str:
        return f"<Member {self.get_id()} object>"

    def create_geometry(self, start_x: Optional[float] = None, start_y: Optional[float] = None,
                        end_x: Optional[float] = None, end_y: Optional[float] = None) -> None:
        self.__nodes = [[start_x, start_y], [end_x, end_y]]

    def set_properties(self, ea: Optional[float] = None, ei: Optional[float] = None,
                       weight: Optional[float] = None) -> None:
        self.__section_data = {"EA": ea,
                               "EI": ei,
                               "weight": weight
                               }

    def set_hinges(self, conditions=None, member_nodes=None) -> None:
        if len(self.__hinges.keys()) > 2:
            raise ValueError(f"There is more than 2 hinges on member {self._id}!")

        else:
            node = 1 if member_nodes == "start" else 2

            if conditions[0] == "hinged":
                self.__hinges[node] = 0

            elif conditions[0] == "stiffness":
                self.__hinges[node] = float(conditions[1])

            elif conditions[0] == "fixed":
                del(self.__hinges[node])

            else:
                raise TypeError("Unknow type of hinge!")

    def get_member_data(self) -> dict:
        data = {
            "location": self.__nodes,
            "spring": self.__hinges
        }

        data["spring"] = None if data["spring"][1] + data["spring"][2] == 0 else data["spring"]

        data.update(self.__section_data)
        data["g"] = data.pop("weight")

        return data


class MyMaterial(StructureElement):
    def __init__(self, name: Optional[str] = None, young: Optional[float] = None,
                 weight: Optional[float] = None) -> None:
        super().__init__(self.__class__.__name__[2:])
        self.__name = name
        self.__young = young
        self.__weight = weight

    def __repr__(self) -> str:
        return f"<Material {self.get_id()} object>"

    def get_young(self) -> float:
        return self.__young

    def get_weight(self) -> float:
        return self.__weight


class MySection(StructureElement):
    def __init__(self, name: Optional[str] = None, section_data: Optional[dict] = None, material: Optional[int] = None,
                 members: Optional[list] = None) -> None:
        super().__init__(self.__class__.__name__[2:])
        self.__name = name
        self.__section_data = section_data

        if isinstance(section_data, dict):
            self.__section_data.update({"frame_analysis": "yes"})

        else:
            self.__section_data += "frame_analysis"

        self.__material = material
        self.__members = members
        self.__area, self.__moment_of_inertia = None, None
        self.__weight, self.__EA, self.__EI = None, None, None
        self.__calculate_properties()

    def __calculate_properties(self) -> None:
        area, iyy = frame_section(self.__section_data, "logged")
        self.__area = area
        self.__moment_of_inertia = iyy

    def get_properties(self) -> Tuple[float, float, float, float, float]:
        return self.__area, self.__moment_of_inertia, self.__EA, self.__EI, self.__weight,

    def get_material_id(self) -> int:
        return int(self.__material)

    def get_members(self):
        return self.__members

    def set_material_to_section(self, young: Optional[float] = None, weight: Optional[float] = None) -> None:
        self.__weight = self.__area * weight
        self.__EA = young * self.__area * 1e-3
        self.__EI = young * self.__moment_of_inertia * 1e-9
        # E přijde v GPa, A+Iy v mm4, výsledné deformace v mm

    def __repr__(self) -> str:
        return f"<Section {self.get_id()} object>"


class MyHinge(StructureElement):
    def __init__(self, element=None, conditions=None, stiffness=None, nodes=None, member_nodes=None) -> None:
        super().__init__(self.__class__.__name__[2:])
        self.__type = element
        self.__conditions = (conditions, stiffness)
        self.__elements = nodes
        self.__member_node = member_nodes

    def get_properties(self):
        return self.__type, self.__conditions, self.__elements.replace(" ", "").split(","), self.__member_node

    def __repr__(self) -> str:
        return f"<Hinge {self.get_id()} object>"


class MySupport(StructureElement):
    def __init__(self, element=None, conditions=None, stiffness=None, nodes=None) -> None:
        super().__init__(self.__class__.__name__[2:])
        self.__type = element
        self.__conditions = (conditions, stiffness)
        self.__elements = nodes
        self.__support_repr = self.__eval_support()

    def get_properties(self):
        return self.__type, self.__conditions, self.__elements.replace(" ", "").split(",")

    def __repr__(self) -> str:
        return f"<Support {self.get_id()} object>"

    def __eval_support(self) -> Union[str, bool]:
        support = self.__conditions[0]

        if support == "spring_x":
            return f"spring({self.__elements}, translation=1, k={float(self.__conditions[1])})"

        elif support == "spring_y":
            return f"spring({self.__elements}, translation=2, k={float(self.__conditions[1])})"

        elif support == "spring_rot":
            return f"spring({self.__elements}, translation=3, k={float(self.__conditions[1])})"

        elif support == "roll_x":
            return f"roll({self.__elements}, direction=1)"

        elif support == "roll_y":
            return f"roll({self.__elements}, direction=2)"

        else:
            if support not in "hinged, fixed":
                print("Unexpected settings of support!!")
                return False

            else:
                return f"hinged(node_id={self.__elements})" if support == "hinged"\
                    else f"fixed(node_id={self.__elements})"

    def get_support_type(self) -> str:
        return self.__support_repr


class LoadStructure:
    """Creator of CO schemas and LC with loads."""

    def __init__(self, lc_data: dict, co_data: dict) -> None:
        self.__LOAD_CASES, self.__LOAD_COMBINATIONS = list(), list()
        self.__lc_data = lc_data
        self.__co_data = co_data
        self.__create_load_cases()
        self.__add_loads()
        self.__define_combinations()

    def __create_load_cases(self) -> None:
        for lc in self.__lc_data.keys():
            self.__LOAD_CASES.append(MyLoadCase(self.__lc_data[lc]))

    def __add_loads(self) -> None:
        for lc in self.__LOAD_CASES:
            lc.define_nodal_loads()
            lc.define_member_loads()

    def __define_combinations(self) -> None:
        if self.__co_data != 0:
            for co in self.__co_data.keys():
                self.__LOAD_COMBINATIONS.append(MyLoadCombination(self.__co_data[co]))

    def get_load_cases(self) -> list:
        return self.__LOAD_CASES

    def get_load_combinations(self) -> list:
        return self.__LOAD_COMBINATIONS


class MyLoadCase:
    __LC_COUNT = 0

    def __init__(self, lc: dict) -> None:
        self.__lc_name = lc["name"]
        self.__nodal_loads_data = lc["loads"]["nodal_loads"]
        self.__member_loads_data = lc["loads"]["member_loads"]
        self.__nodal_loads, self.__member_loads = list(), list()
        self.__self_weight_active = lc["selfWeight"]
        self.__id = MyLoadCase.__create_id()

    def get_id(self) -> int:
        return self.__id

    def define_nodal_loads(self) -> None:
        for nodal_load in self.__nodal_loads_data.keys():
            self.__nodal_loads.append(MyNodalLoad(self.__nodal_loads_data[nodal_load], nodal_load))

    def define_member_loads(self) -> None:
        for member_load in self.__member_loads_data.keys():
            self.__member_loads.append(MyMemberLoad(self.__member_loads_data[member_load], member_load))

    def get_lc_name(self) -> str:
        return self.__lc_name

    def get_nodal_loads(self) -> list:
        return self.__nodal_loads

    def get_member_loads(self) -> list:
        return self.__member_loads

    @classmethod
    def __create_id(cls) -> int:
        cls.__LC_COUNT += 1
        return cls.__LC_COUNT

    @classmethod
    def restart_counter(cls) -> None:
        cls.__LC_COUNT = 0


class Loads:
    def __init__(self, load_id: str, elements: list) -> None:
        self.__id = load_id
        self._elements = [int(el) for el in elements]
        self._magnitude, self._rotation = None, None

    def get_id(self) -> str:
        return self.__id


class MyNodalLoad(Loads):
    def __init__(self, load: dict, load_id: str) -> None:
        nodes_ids = ServerValidation("").check_elements_ids(
            load["nodes"], "nodes", elements_count=StructureCreator().get_count_of_nodes())

        super().__init__(load_id, nodes_ids)
        self.__load_type = load["loadType"]
        self.__force_x, self.__force_y = None, None
        self.__define_load(load)

    def get_type(self) -> str:
        return self.__load_type

    def __define_load(self, load: dict) -> None:
        if self.__load_type in "force, moment":
            self.__force_x = load["magnitude"]
            self.__force_y = 0
            self.__rotation = load["forceRotation"]

        elif self.__load_type == "force_components":
            self.__force_x = load["forceX"]
            self.__force_y = load["forceY"]
            self.__rotation = None

        else:
            raise TypeError("Unexpected type of nodal load!")

    def get_nodal_load_parameters(self) -> str:
        if "force" in self.__load_type:
            if self.__rotation is None:
                return f"point_load({self._elements}, Fx={self.__force_x}, Fy={self.__force_y})"

            else:
                return f"point_load({self._elements}, Fx={self.__force_x}, Fy={self.__force_y}, " \
                       f"rotation={self.__rotation})"

        else:
            return f"moment_load({self._elements}, {self.__force_x})"


class MyMemberLoad(Loads):
    def __init__(self, load: dict, load_id: str) -> None:
        members_ids = ServerValidation("").check_elements_ids(
            load["members"], "members", elements_count=StructureElement().get_count_of_element("MEMBERS"))

        super().__init__(load_id, members_ids)
        self.__direction = "'" + load["direction"] + "'"
        self.__define_load(load)

    def __define_load(self, load:  dict) -> None:
        self._magnitude = "-" + load["magnitude"]

        if self.__direction in "'element', 'parallel', 'x', 'y'":
            pass

        elif self.__direction == "'rotate'":
            self.__direction = "'x'"

        else:
            raise TypeError("Unexpected type of member load!")

    def get_member_load_parameters(self) -> str:
        return f"q={self._magnitude}, element_id={self._elements}, direction={self.__direction}"


class MyLoadCombination:
    __CO_COUNT = 0

    def __init__(self, lc: dict) -> None:
        import inspect
        self.__co_name = lc["name"]
        self.__load_combinations_data = lc["loads"]
        self.__id = MyLoadCombination.__create_id()
        self.__load_cases = inspect.stack()[1][0].f_locals["self"].get_load_cases()
        self.__factored_lcs = list()
        self.__create_combination()

    def get_id(self) -> int:
        return self.__id

    def get_co_name(self) -> str:
        return self.__co_name

    def get_factored_lcs(self) -> list:
        return self.__factored_lcs

    def __create_combination(self) -> None:
        for lc_data in self.__load_combinations_data.values():
            current_lc = [lc for lc in self.__load_cases if lc.get_id() == int(lc_data["identifier"])][0]
            self.__factored_lcs.append((current_lc, lc_data["factor"]))

    @classmethod
    def __create_id(cls) -> int:
        cls.__CO_COUNT += 1
        return cls.__CO_COUNT

    @classmethod
    def restart_counter(cls) -> None:
        cls.__CO_COUNT = 0
