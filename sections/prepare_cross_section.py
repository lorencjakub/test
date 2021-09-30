from root.sections import create_geometry, section_properties
import sectionproperties.pre.sections as sections
from sectionproperties.analysis.cross_section import CrossSection


class MySection:

    def __init__(self, form_data):
        self.form_data = form_data
        self.initial_data = dict()

        # analýza konstrukce s načteným průřezem
        if "image" in form_data and "frame_analysis" in form_data:
            self.form_data = f"dimension_type=usr&section_name={form_data}"
            self.prepare_init_data()
            self.initial_data.update({"frame_analysis": "yes"})

        # frame analysis s nově definovaným průřezem
        elif "frame_analysis" in form_data:
            self.initial_data = form_data
            self.initial_data.update({"frame_analysis": "yes"})

        # analýza průřezu nebo napětí
        else:
            self.prepare_init_data()

        self.section_type = self.initial_data['dimension_type']
        self.part, self.proportions = None, None
        self.points, self.facets, self.holes = None, None, None
        self.control_points, self.shift, self.perimeter = None, None, None
        self.first_section, self.second_section, self.section = None, None, None
        self.geometry, self.mesh, self.section_results = None, None, None

    def get_initial_data(self):
        return self.initial_data

    def prepare_init_data(self):
        self.initial_data = {data_pair.split("=")[0]: data_pair.split("=")[1]
                             for data_pair in self.form_data.split("&")}
        self.initial_data.update({'ID': 'ID'})

        """ ID je část unikátního ID pro plotované obrázky, pro téměř všechny průřezy se rovná stringu ID, ale pro
        canvas průřezy tvojí právě jedinečný identifikátor """

        return self.initial_data

    def prepare_cross_section(self):
        if self.section_type == 'mrg':
            print('Tvořím geometrii prvního profilu složeného průřezu...')
            self.part = '_fir'
            self.prepare_final_geometry()

            merged_hole_x, merged_hole_y = self.proportions['merged_hole_x'], self.proportions['merged_hole_y']

            first_mesh = self.proportions['FE_number_fir']
            first_n = str(self.proportions['n'])
            first_dim_type = str(self.proportions['dimension_type_fir'])

            self.points, self.holes, self.perimeter, self.shift, self.control_points, self.facets = \
                create_geometry.send_geometry(self.proportions, self.part)

            self.first_section = section_properties.CrossSectionForLibrary(self.proportions, self.points, self.facets,
                                                                           self.holes, self.control_points, self.shift,
                                                                           self.perimeter, self.part).geometry

            """
            Pokud ve složeném průřezu vznikne dutina, je chápána jako vyplněný blok. Metoda add_holes_for_section
            třídy CrossSectionForLibrary iteračně najde vhodný prostor pro definici otvoru tím, že určí plochy obou
            dílčích průřezů a navrženého složenéo průřezu. Pokud součet dílčích ploch neodpovídá celkové ploše, některá
            dutina byla pochopena špatně a funkce vybere jiné umístění. Takto pokračuje, dokud nedefinuje dutinu správně
            a taková konfigurace bude předána do pokračování výpočtu.
            """
            test_calculate_first = CrossSection(self.first_section, self.first_section.create_mesh(mesh_sizes=[15]))
            test_calculate_first.calculate_geometric_properties()
            first_area = test_calculate_first.get_area()

            print('Dílčí geometrie připravena!')
            print('Tvořím geometrii druhého profilu složeného průřezu...')
            self.part = '_sec'
            self.prepare_final_geometry()
            self.proportions.update([
                ('shift_x', float(self.proportions['shift_x'])),
                ('shift_y', float(self.proportions['shift_y']))
            ])
            second_mesh = self.proportions['FE_number_sec']
            second_n = str(self.proportions['n'])
            second_dim_type = str(self.proportions['dimension_type_sec'])

            self.points, self.holes, self.perimeter, self.shift, self.control_points, self.facets = \
                create_geometry.send_geometry(self.proportions, self.part)

            if self.proportions['is_welded_sec'] == 'yes' and (second_dim_type != 'rtg') and (second_dim_type != 'crl'):
                self.shift = [0, 0]     # jelikož už je započítán do souřadnic bodů

            self.second_section = section_properties.CrossSectionForLibrary(self.proportions, self.points, self.facets,
                                                                            self.holes, self.control_points, self.shift,
                                                                            self.perimeter, self.part).geometry
            # výpočet plochy druhého dílčího průřezu
            test_calculate_second = CrossSection(self.second_section, self.second_section.create_mesh(mesh_sizes=[15]))
            test_calculate_second.calculate_geometric_properties()
            second_area = test_calculate_second.get_area()

            print('Dílčí geometrie připravena! Tvořím geometrii složeného průřezu...')

            self.proportions['FE_number'] = (first_mesh, second_mesh)

            self.geometry = sections.MergedSection([self.first_section, self.second_section])

            self.geometry.clean_geometry()

            merged_area = 0

            if (merged_hole_x == '') and (merged_hole_y == ''):
                test_calculate = CrossSection(self.geometry, self.geometry.create_mesh(mesh_sizes=[15, 15]))
                test_calculate.calculate_geometric_properties()
                merged_area = test_calculate.get_area()

                if (round(first_area + second_area)) != round(merged_area):
                    self.geometry = 'block_in_hole'

            else:
                hole = [float(merged_hole_x), float(merged_hole_y)]
                self.geometry.add_hole(hole)
                self.geometry.clean_geometry()

            if round(merged_area, 1) != round(first_area + second_area, 1) and round(merged_area, 1):
                self.geometry = 'block_in_hole'

            self.proportions['dimension_type'] = 'mrg'
            self.proportions['dimension_type'] = 'mrg'
            self.proportions['n'] = str(first_dim_type) + str(first_n) + ' + ' + str(second_dim_type) + str(second_n)
            print('Celková geometrie připravena!')

        elif self.section_type == 'usr':
            return self.initial_data, 0, 0

        else:
            print('Tvořím geometrii průřezu...')
            self.part = ''
            self.prepare_final_geometry()

            self.points, self.holes, self.perimeter, self.shift, self.control_points, self.facets = \
                create_geometry.send_geometry(self.proportions, self.part)

            self.geometry = section_properties.CrossSectionForLibrary(self.proportions, self.points, self.facets,
                                                                      self.holes, self.control_points, self.shift,
                                                                      self.perimeter, self.part).geometry
            print('Geometrie připravena!')

        return self.initial_data, self.proportions, self.geometry

    def prepare_final_geometry(self):
        initial_prop = create_geometry.DataGatherer(self.initial_data,
                                                    self.part)  # vytvoří list průřezu na míru
        self.proportions = initial_prop.initial_proportions

        """Hotový list průřezu, v případě válcovaných průřezů slouží jako plnohodnotný vstup pro geometrii,
        u svařovaných průřezů se z něj tvoří listy údajů o parametrickém průřezu."""

        return self.proportions, self.points, self.facets, self.holes, self.control_points, self.shift, self.perimeter

    def mesh_of_section(self):
        # vytvoří síť konečnýcýh prvků na průřezu, v závislosti na velikosti prvku, zadané uživatelem
        el_area = self.proportions['FE_number']

        if type(el_area) != float:
            self.mesh = self.geometry.create_mesh(mesh_sizes=[el_area[0], el_area[1]])

        else:
            self.mesh = self.geometry.create_mesh(mesh_sizes=[el_area])

        return self.mesh
        # pro přůřezovou knihovnu vrátí objekt se zadáním sítě
