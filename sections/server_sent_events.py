from sectionproperties.analysis.cross_section import CrossSection
from sectionproperties.pre.pre import Material
from root.sections.section_properties import GetAllOfResults as getResults
import time
from root.sections import cross_section_manager
from .prepare_cross_section import MySection
from ..static.pictures import picture_manager
import os
from pathlib import Path
import root
from .models import SectionFiles
from root.users.models import Users
import datetime
import json
from root.error_handlers import db_error, request_error, SaveLimit
from sqlalchemy.orm import load_only
# from root.sections.copy_database import copy_order

"""Funkce spouštěné na aktivním SSE kanálu. Pomocí nich se zjišťují inputy při tvorbě formuláře welded průřezu,
dimenze pro rolled průřez a při submitu formuláře zde proběhne výpočet samotného průřezu. """


def calculate(form_data, user_status):
    my_section = Calculate(form_data, user_status)
    print('Mazání neaktuálních souborů...')
    # vyčištění obrázků v adresáři jako prevence před komplikacemi při plotování obrázku průřezu

    yield "data:" + str(0) + "\n\n"

    if not my_section.create_initial_section():
        pass
        yield "data:block_in_hole" + "\n\n"

    solve_functions, yields = my_section.solve(False)

    for (function, status) in zip(solve_functions[:-1], yields):
        eval("my_section." + function)
        yield "data:" + str(status) + "\n\n"

    print('Zpracování výsledků...')
    yield "data:" + str(90) + "\n\n"
    result_dictionary = eval("my_section." + solve_functions[-1])
    results = json.dumps(result_dictionary)

    print('Výsledky zpracovány! Odesílám uživateli...')
    yield "data:" + results + "\n\n"  # odeslání json stringu na stránku, konec SSE kanálu
    # hotovo


def frame_section(form_data, user_status):
    my_section = Calculate(form_data, user_status)
    print('Mazání neaktuálních souborů...')
    # vyčištění obrázků v adresáři jako prevence před komplikacemi při plotování obrázku průřezu

    my_section.create_initial_section()
    my_section.solve(True)

    return my_section.calculate_frame_properties()


class Calculate:
    """Server-sent event pro výpočet, metodou GET přijímá json data o průřezu a průběžně vrací
    aktuální stav výpočtu pro progress bar na stránce. Po dokončení výpočtu vrátí stránce json výsledky.
    Každý řádek 'yield' značí, že se SSE kanálem na stránku poslala nová hodnota,
    symbolizující aktuální stav výpočtu."""

    def __init__(self, form_data, user_status):
        self.__form_data = form_data
        self.__user_status = user_status
        self.__initial_data, self.__proportions, self.__geometry = None, None, None
        self.__stressing_forces = None
        self.__calculate_options = dict()
        self.__section_origin = "original"
        self.__time_hash = self.__picture_manager()

        self.__new_cross_section = None
        self.__section, self.__mesh = None, None
        self.__buttons = list()

    @staticmethod
    def __picture_manager():
        picture_manager.refresh_sections(root.app.static_folder + '/pictures/users/temp')

        return str(round(time.time(), 0)).replace('.0', '')  # získání části identifikátoru z aktuálního času

    def create_initial_section(self):
        print('Tvořím vstupní data...')
        self.__new_cross_section = MySection(self.__form_data)
        self.__initial_data, self.__proportions, self.__geometry = self.__new_cross_section.prepare_cross_section()

        self.__stressed_section()

        return False if self.__geometry == 'block_in_hole' else True

    def __stressed_section(self):
        try:
            if self.__initial_data["stressing_forces"]:
                self.__stressing_forces = self.__initial_data["stressing_forces"]
                self.__calculate_options.update({
                    "stress_axis": self.__initial_data["stress_axis"],
                    "stress_forces": self.__initial_data["stress_forces"],
                    "von_mises": self.__initial_data["von_mises"],
                    "sigma_tau": self.__initial_data["sigma_tau"]
                })

        except KeyError:
            print("Nejedná se o výpočet napětí.")

            self.__calculate_options.update({
                "geometric_properties": self.__initial_data["geometric_value"],
                "warping_properties": self.__initial_data["warping_value"],
                "plastic_properties": self.__initial_data["plastic_value"]
            })

    def __get_buttons(self):
        pdf_button = '<input type="button" id="pdfSave" value="Ulož do PDF" onclick="pdfSave();"' \
                     'class="btn btn-secondary rounded m-1">'

        new_button = '<input type= "button" id="nextSection" value="Nový průřez" onclick="nextSection(this.id);"' \
                     'class="btn btn-secondary rounded m-1">'

        save_button = '<input type="button" id="sectionSave" value="Ulož průřez" onclick="sectionSave();"' \
                      'class="btn btn-secondary rounded m-1">'

        self.__buttons = [pdf_button, save_button, new_button] \
            if self.__user_status == 'logged' and self.__stressing_forces is None\
            else [pdf_button, new_button]

        return self.__buttons

    def solve(self, frame):
        if self.__geometry == 0:
            self.__load_section()

        else:
            self.__prepare_new_section()

        if frame:
            calculates = ["calculate_frame_properties()"]
            yields = [25]

        elif not self.__stressing_forces:
            calculates = ["calculate_geometric_properties()"]
            yields = [20]

            #  torzní a výsečové charakteristiky
            if self.__calculate_options["warping_properties"] == "yes" or \
                    self.__calculate_options["plastic_properties"] == "yes":
                calculates.append("calculate_warping_properties()")
                yields.append(60)

            # plastické charakteristiky
            if self.__calculate_options["plastic_properties"] == "yes":
                calculates.append("calculate_plastic_properties()")
                yields.append(90)

            calculates.append("properties_calculate()")
            self.__get_buttons()

        else:
            calculates = ["calculate_geometric_properties()", "calculate_warping_properties()",
                          "calculate_plastic_properties()", "stresses_calculate()"]
            yields = [25, 45, 65]
            self.__get_buttons()

        return calculates, yields

    def __prepare_new_section(self):
        time.sleep(0.2)
        print('Vytvářím síť konečných prvků...')
        mesh = self.__new_cross_section.mesh_of_section()
        time.sleep(0.2)

        print('Spouštím analýzu průřezu...')
        # uložení meshe průřezu do listu údajů o meshi (listy údajů tvořeny souřadnicemi dvou floatů)
        mesh_data = mesh.dump()
        self.__section = CrossSection(self.__geometry, mesh_data)

        self.__get_section_thumbnail()

    def __get_section_thumbnail(self):
        steel = Material(name='Steel', elastic_modulus=200e3, poissons_ratio=0.3, yield_strength=250, color='skyblue')

        if self.__initial_data['dimension_type'] != 'mrg':
            section_for_plot = CrossSection(self.__geometry, self.__mesh, [steel])

        else:
            section_for_plot = CrossSection(self.__geometry, self.__mesh, [steel, steel])

        print('Analýza dokončena!')

        yield "data:" + str(15) + "\n\n"
        # analýza dokončena
        time.sleep(0.2)

        if self.__stressing_forces == 0:
            section_for_plot.plot_mesh(materials=True)

            dim_type = self.__proportions['dimension_type']  # získání části identifikátoru z typu průřezu
            # přejmenování obrázku na unikátní název s identifikátorem
            picture_manager.unique_picture(self.__time_hash, dim_type, self.__section_origin, "mesh")

    def __load_section(self):
        time_id = self.__initial_data['section_name'][8:-4]
        filenames = SectionFiles.query.filter(SectionFiles.filename.like(f"%{time_id}%")).all()

        files = []
        for i in range(len(filenames)):
            if ".svg" not in filenames[i].filename:
                files.append(filenames[i].filename)

        identifier = filenames[0].user_identifier

        self.__section, loaded_initial_data, self.__proportions = cross_section_manager.load_cross_section(
            identifier, files)
        self.__section_origin = 'loaded'

        if self.__stressing_forces == 0:
            loaded_initial_data["geometric_value"] = self.__initial_data["geometric_value"]
            loaded_initial_data["warping_value"] = self.__initial_data["warping_value"]
            loaded_initial_data["plastic_value"] = self.__initial_data["plastic_value"]

        self.__initial_data = loaded_initial_data

    def properties_calculate(self):
        # získání obrázku průřezu z přůezové knihovny
        print('Zpracování výsledků...')
        self.__section.plot_centroids()

        dim_type = self.__proportions['dimension_type']  # získání části identifikátoru z typu průřezu
        # přejmenování obrázku na unikátní název s identifikátorem
        picture_manager.unique_picture(self.__time_hash, dim_type, self.__section_origin, "centroid")

        # uložený dočasných souborů pro možnost uložení průřezu
        if self.__user_status == 'logged':
            cross_section_manager.save_temp_cross_section(self.__section, self.__initial_data,
                                                          self.__proportions, self.__time_hash)

        area = self.__section.get_area()
        perimeter = self.__section.get_perimeter()
        section_results = getResults(self.__section, self.__initial_data, self.__proportions, area).results

        img_src = self.__proportions['dimension_type']  # část identifikátoru obrázku

        if dim_type == 'cnv':
            self.__proportions['dimension_type'] = 'Uživatelský průřez'

        elif dim_type == 'mrg':
            self.__proportions['dimension_type'] = 'Složený průřez'

        elif dim_type == 'crl':
            self.__proportions['dimension_type'] = 'Kulatina'

        elif dim_type == 'rtg':
            self.__proportions['dimension_type'] = 'Plech'

        # vytvoření dictionary výsledků
        result_dictionary = {'dim_type': self.__proportions['dimension_type'],
                             'dim_val': self.__proportions['n'],
                             'name': 'Cross-section',
                             'img_src': f'static/pictures/users/temp/section{img_src}{self.__time_hash}.svg',
                             'buttons': self.__buttons,
                             "geometric": self.__calculate_options["geometric_properties"],
                             "warping": self.__calculate_options["warping_properties"],
                             "plastic": self.__calculate_options["plastic_properties"]
                             }

        if self.__calculate_options["geometric_properties"] == "yes":
            result_dictionary.update({
                'area': '{:.3e}'.format(area / 1000000),
                'self_weight': round((section_results['area'] / 1000000) * 7850, 3),
                'perimeter': round(perimeter / 1000, 4),
                'in_mom_y': '{:.3e}'.format(section_results['in_mom_y'] / 1000000000000),
                'in_mom_z': '{:.3e}'.format(section_results['in_mom_z'] / 1000000000000),
                'in_mom_u': '{:.3e}'.format(section_results['in_mom_u'] / 1000000000000),
                'in_mom_v': '{:.3e}'.format(section_results['in_mom_v'] / 1000000000000),
                'dev_mom_yz': '{:.3e}'.format(round(section_results['dev_mom_yz'] / 1000000000000000, 15)),
                'zcgh': '{:.2f}'.format(section_results['zcgh']),
                'ycgl': '{:.2f}'.format(section_results['ycgl']),
                'wely': '{:.3e}'.format(min(abs(section_results['wymax'] / 1000000000),
                                            abs(section_results['wymin'] / 1000000000))),
                'welz': '{:.3e}'.format(min(abs(section_results['wzmax'] / 1000000000),
                                            abs(section_results['wzmin'] / 1000000000))),
                'welu': '{:.3e}'.format(min(abs(section_results['wumax'] / 1000000000),
                                            abs(section_results['wumin'] / 1000000000))),
                'welv': '{:.3e}'.format(min(abs(section_results['wvmax'] / 1000000000),
                                            abs(section_results['wvmin'] / 1000000000))),
                'alfa_deg': '{:.2f}'.format(section_results['alfa_deg']),
                'in_rad_y': '{:.2f}'.format(section_results["in_rad_y"]),
                'in_rad_z': '{:.2f}'.format(section_results["in_rad_z"]),
                'in_rad_u': '{:.2f}'.format(section_results["in_rad_u"]),
                'in_rad_v': '{:.2f}'.format(section_results["in_rad_v"]),
            })

        if self.__calculate_options["plastic_properties"] == "yes":
            result_dictionary.update({
                'wply': '{:.3e}'.format(section_results['wply'] / 1000000000),
                'wplz': '{:.3e}'.format(section_results['wplz'] / 1000000000),
                'wplu': '{:.3e}'.format(section_results['wplu'] / 1000000000),
                'wplv': '{:.3e}'.format(section_results['wplv'] / 1000000000),
                'avy': '{:.3e}'.format(section_results['shear_area_y'] / 1000),
                'avz': '{:.3e}'.format(section_results['shear_area_z'] / 1000),
                'avu': '{:.3e}'.format(section_results['shear_area_u'] / 1000),
                'avv': '{:.3e}'.format(section_results['shear_area_v'] / 1000)
            })

        if self.__calculate_options["warping_properties"] == "yes":
            result_dictionary.update({
                'tors_mom': '{:.3e}'.format(section_results['tors_moment'] / 1000000000000),
                'shear_center_y': '{:.2f}'.format(section_results['shear_center_y']),
                'shear_center_z': '{:.2f}'.format(section_results['shear_center_z']),
                'in_mom_w': '{:.3e}'.format(section_results['in_mom_w'] / 1000000000000000000),
                'tors_modulus': '{:.3e}'.format(section_results['tors_modulus'] / 1000000000),
                'polar_mom': '{:.3e}'.format(section_results['polar_moment'] / 1000000000000),
                'in_rad_p': '{:.2f}'.format(section_results["in_rad_p"])
            })

        return result_dictionary

    def calculate_geometric_properties(self):
        self.__section.calculate_geometric_properties()

    def calculate_warping_properties(self):
        self.__section.calculate_warping_properties()

    def calculate_plastic_properties(self):
        self.__section.calculate_plastic_properties()

    def calculate_frame_properties(self):
        area, ixx, iyy, ixy, j, phi = self.__section.calculate_frame_properties()

        return float(str(area)), float(str(ixx))

    def stresses_calculate(self):
        self.__initial_data.update({"stressing_forces": self.__stressing_forces})

        internal_forces_data = self.__stressing_forces.split("|")
        internal_forces = {}

        for i in range(len(internal_forces_data)):
            internal_forces.update({internal_forces_data[i].split(":")[0]: internal_forces_data[i].split(":")[1]})

        print("Spouštím analýzu napětí...")

        # analýza napětí podle zatížení, zatížení je definováno v kN a v kNm
        # převod vnitřních sil: N=Nxx, Vx=Vyy, Vy=Vzz, Mxx=Myy, Myy=Mzz, M11=M11, M22=M22, Mzz=Mxx
        stress_post = self.__section.calculate_stress(N=float(internal_forces["Nxx"]) * 1000,
                                                      Vx=float(internal_forces["Vyy"]) * 1000,
                                                      Vy=float(internal_forces["Vzz"]) * 1000,
                                                      Mxx=float(internal_forces["Myy"]) * 1000000,
                                                      Myy=float(internal_forces["Mzz"]) * 1000000,
                                                      M11=float(internal_forces["M11"]) * 1000000,
                                                      M22=float(internal_forces["M22"]) * 1000000,
                                                      Mzz=float(internal_forces["Mxx"]) * 1000000,
                                                      time_info=False)

        print('Analýza napětí dokočena!')

        # napětí získána
        stress_pictures_sources, stress_pictures_names, stresses = self.__plot_stress_pictures(
            internal_forces, stress_post)

        """
        Dict stresses obsahující max a min hodnoty napětí je zde vytvořen, ale zatím se nepředá dál -
        může být v budoucnu využít např. pro kontrolu napětí v posudku nebo klasifikaci průřezu
        """

        dim_type = self.__proportions['dimension_type']

        # vytvoření dictionary výsledků
        result_dictionary = {'dim_type': dim_type,
                             'dim_val': self.__proportions['n'],
                             'name': 'Cross-section',
                             'buttons': self.__buttons
                             }

        for n in range(len(stress_pictures_names)):
            result_dictionary.update({
                stress_pictures_names[n]:
                    f"static/pictures/users/temp/{dim_type}{self.__time_hash}{stress_pictures_sources[n]}"
            })

        return result_dictionary

    def __plot_stress_pictures(self, internal_forces, stress_post):
        # převod vnitřních sil: N=Nxx, Vx=Vyy, Vy=Vzz, Mxx=Myy, Myy=Mzz, M11=M11, M22=M22, Mzz=Mxx
        # pozn.: grafické výsledky napětí jsou v MPa

        stress_pictures_names = []
        stress_pictures_sources = []
        stresses = {}
        stress_results = stress_post.get_stress()

        # -------------- NORMÁLOVÁ SÍLA ------------------------------------------------------
        if float(internal_forces["Nxx"]) != 0:
            # normálové napětí od normálové síly N
            self.__print_stresses(stress_post, "stress_post.plot_stress_n_zz()", "stress_sigma_zz_N_section.svg")
            stress_pictures_sources.append("stress_sigma_zz_N_section.svg")
            stress_pictures_names.append("Normálové napětí od N")
            stresses.update({"sig_zz_n": [min(stress_results[0]["sig_zz_n"]),
                                          max(stress_results[0]["sig_zz_n"])]})
        # -------------- NORMÁLOVÁ SÍLA ------------------------------------------------------

        # -------------- OHYBOVÉ MOMENTY -----------------------------------------------------
        bending_moments = float(internal_forces["Myy"]) + float(internal_forces["Mzz"]) \
                          + float(internal_forces["M11"]) + float(internal_forces["M22"])

        if self.__calculate_options["stress_forces"] == "yes":
            if float(internal_forces["Myy"]) != 0:
                # normálové napětí od ohybového momentu My
                self.__print_stresses(stress_post, "stress_post.plot_stress_mxx_zz()",
                                      "stress_sigma_zz_Mxx_section.svg")
                stress_pictures_sources.append("stress_sigma_zz_Mxx_section.svg")
                stress_pictures_names.append("Normálové napětí od My")
                stresses.update({"sig_zz_mxx": [min(stress_results[0]["sig_zz_mxx"]),
                                                max(stress_results[0]["sig_zz_mxx"])]})

            if float(internal_forces["Mzz"]) != 0:
                # normálové napětí od ohybového momentu Mz
                self.__print_stresses(stress_post, "stress_post.plot_stress_myy_zz()",
                                      "stress_sigma_zz_Myy_section.svg")
                stress_pictures_sources.append("stress_sigma_zz_Myy_section.svg")
                stress_pictures_names.append("Normálové napětí od Mz")
                stresses.update({"sig_zz_myy": [min(stress_results[0]["sig_zz_myy"]),
                                                max(stress_results[0]["sig_zz_myy"])]})

            if float(internal_forces["M11"]) != 0:
                # normálové napětí od ohybového momentu M11
                self.__print_stresses(stress_post, "stress_post.plot_stress_m11_zz()",
                                      "stress_sigma_zz_M11_section.svg")
                stress_pictures_sources.append("stress_sigma_zz_M11_section.svg")
                stress_pictures_names.append("Normálové napětí od Mu")
                stresses.update({"sig_zz_m11": [min(stress_results[0]["sig_zz_m11"]),
                                                max(stress_results[0]["sig_zz_m11"])]})

            if float(internal_forces["M22"]) != 0:
                # normálové napětí od ohybového momentu M22
                self.__print_stresses(stress_post, "stress_post.plot_stress_m22_zz()",
                                      "stress_sigma_zz_M22_section.svg")
                stress_pictures_sources.append("stress_sigma_zz_M22_section.svg")
                stress_pictures_names.append("Normálové napětí od Mv")
                stresses.update({"sig_zz_m22": [min(stress_results[0]["sig_zz_m22"]),
                                                max(stress_results[0]["sig_zz_m22"])]})

        if bending_moments != 0:
            # výsledné normálové napětí od všech ohybových momentů
            self.__print_stresses(stress_post, "stress_post.plot_stress_m_zz()",
                                  "stress_zz_M_section.svg")
            stress_pictures_sources.append("stress_zz_M_section.svg")
            stress_pictures_names.append("Normálové napětí od ohybových momentů")
            stresses.update({"sig_zz_m": [min(stress_results[0]["sig_zz_m"]),
                                          max(stress_results[0]["sig_zz_m"])]})
        # -------------- OHYBOVÉ MOMENTY -----------------------------------------------------

        # -------------- KROUTÍCÍ MOMENT -----------------------------------------------------
        if float(internal_forces["Mxx"]) != 0:
            if self.__calculate_options["stress_axis"] == "yes":
                # x-ová složka smykového napětí od kroutícího momentu Mzz
                self.__print_stresses(stress_post, "stress_post.plot_stress_mzz_zx()",
                                      "stress_sigma_zx_Mzz_section.svg")
                stress_pictures_sources.append("stress_sigma_zx_Mzz_section.svg")
                stress_pictures_names.append("Smykové napětí od Mx, směr y")
                stresses.update({"sig_zx_mzz": [min(stress_results[0]["sig_zx_mzz"]),
                                                max(stress_results[0]["sig_zx_mzz"])]})

                # y-ová složka smykového napětí od kroutícího momentu Mzz
                self.__print_stresses(stress_post, "stress_post.plot_stress_mzz_zy()",
                                      "stress_sigma_zy_Mzz_section.svg")
                stress_pictures_sources.append("stress_sigma_zy_Mzz_section.svg")
                stress_pictures_names.append("Smykové napětí od Mx, směr z")
                stresses.update({"sig_zy_mzz": [min(stress_results[0]["sig_zy_mzz"]),
                                                max(stress_results[0]["sig_zy_mzz"])]})

            # výsledné smykové napětí od kroutícího momentu Mx
            self.__print_stresses(stress_post, "stress_post.plot_stress_mzz_zxy()", "stress_sigma_zxy_Mzz_section.svg")
            stress_pictures_sources.append("stress_sigma_zxy_Mzz_section.svg")
            stress_pictures_names.append("Smykové napětí od Mx")
            stresses.update({"sig_zxy_mzz": [min(stress_results[0]["sig_zxy_mzz"]),
                                             max(stress_results[0]["sig_zxy_mzz"])]})

            # stress_post.plot_vector_mzz_zxy()   # tok výsledného smykového napětí od kroutícího momentu Mzz
        # -------------- KROUTÍCÍ MOMENT -----------------------------------------------------

        # -------------- POSOUVAJÍCÍ SÍLY ----------------------------------------------------
        shear_forces = float(internal_forces["Vyy"]) + float(internal_forces["Vzz"])

        if shear_forces != 0:
            if self.__calculate_options["stress_axis"] == "yes":
                # x-ová složka celkového smykového napětí od posouvajících sil Vx a Vy
                self.__print_stresses(stress_post, "stress_post.plot_stress_v_zx()", "stress_zx_V_section.svg")
                stress_pictures_sources.append("stress_zx_V_section.svg")
                stress_pictures_names.append("Smykové napětí od posouvajících sil, směr y")
                stresses.update({"sig_zx_v": [min(stress_results[0]["sig_zx_v"]),
                                              max(stress_results[0]["sig_zx_v"])]})

                # y-ová složka celkového smykového napětí od posouvajících sil Vx a Vy
                self.__print_stresses(stress_post, "stress_post.plot_stress_v_zy()", "stress_zy_V_section.svg")
                stress_pictures_sources.append("stress_zy_V_section.svg")
                stress_pictures_names.append("Smykové napětí od posouvajících sil, směr z")
                stresses.update({"sig_zy_v": [min(stress_results[0]["sig_zy_v"]),
                                              max(stress_results[0]["sig_zy_v"])]})

            # výsledné celkové smykové napětí od posouvajících sil Vy a Vz
            self.__print_stresses(stress_post, "stress_post.plot_stress_v_zxy()", "stress_zxy_V_section.svg")
            stress_pictures_sources.append("stress_zxy_V_section.svg")
            stress_pictures_names.append("Smykové napětí od posouvajících sil")
            stresses.update({"sig_zxy_v": [min(stress_results[0]["sig_zxy_v"]),
                                           max(stress_results[0]["sig_zxy_v"])]})

            # stress_post.plot_vector_v_zxy() # tok výsledného celkového smykového napětí od posouvajících síl Vx a Vy

        if float(internal_forces["Vyy"]) != 0:
            if self.__calculate_options["stress_forces"] == "yes":
                if self.__calculate_options["stress_axis"] == "yes":
                    # x-ová složka smykového napětí od posouvající síly Vx
                    self.__print_stresses(stress_post, "stress_post.plot_stress_vx_zx()",
                                          "stress_sigma_zx_Vx_section.svg")
                    stress_pictures_sources.append("stress_sigma_zx_Vx_section.svg")
                    stress_pictures_names.append("Smykové napětí od Vy, směr y")
                    stresses.update({"sig_zx_vx": [min(stress_results[0]["sig_zx_vx"]),
                                                   max(stress_results[0]["sig_zx_vx"])]})

                    # y-ová složka smykového napětí od posouvající síly Vx
                    self.__print_stresses(stress_post, "stress_post.plot_stress_vx_zy()",
                                          "stress_sigma_zy_Vx_section.svg")
                    stress_pictures_sources.append("stress_sigma_zy_Vx_section.svg")
                    stress_pictures_names.append("Smykové napětí od Vy, směr z")
                    stresses.update({"sig_zy_vx": [min(stress_results[0]["sig_zy_vx"]),
                                                   max(stress_results[0]["sig_zy_vx"])]})

                if self.__calculate_options["stress_forces"] == "yes":
                    # výsledné smykového napětí od posouvající síly Vy
                    self.__print_stresses(stress_post, "stress_post.plot_stress_vx_zxy()",
                                          "stress_sigma_zxy_Vx_section.svg")
                    stress_pictures_sources.append("stress_sigma_zxy_Vx_section.svg")
                    stress_pictures_names.append("Smykové napětí od Vy")
                    stresses.update({"sig_zxy_vx": [min(stress_results[0]["sig_zz_n"]),
                                                    max(stress_results[0]["sig_zz_n"])]})

                    # stress_post.plot_vector_vx_zxy()    # tok výsledného smykového napětí od posouvající síly Vx

        if float(internal_forces["Vzz"]) != 0:
            if self.__calculate_options["stress_forces"] == "yes":
                if self.__calculate_options["stress_axis"] == "yes":
                    # x-ová složka smykového napětí od posouvající síly Vy
                    self.__print_stresses(stress_post, "stress_post.plot_stress_vy_zx()",
                                          "stress_sigma_zx_Vy_section.svg")
                    stress_pictures_sources.append("stress_sigma_zx_Vy_section.svg")
                    stress_pictures_names.append("Smykové napětí od Vz, směr y")
                    stresses.update({"sig_zx_vy": [min(stress_results[0]["sig_zx_vy"]),
                                                   max(stress_results[0]["sig_zx_vy"])]})

                    # y-ová složka smykového napětí od posouvající síly Vy
                    self.__print_stresses(stress_post, "stress_post.plot_stress_vy_zy()",
                                          "stress_sigma_zy_Vy_section.svg")
                    stress_pictures_sources.append("stress_sigma_zy_Vy_section.svg")
                    stress_pictures_names.append("Smykové napětí od Vz, směr z")
                    stresses.update({"sig_zy_vy": [min(stress_results[0]["sig_zy_vy"]),
                                                   max(stress_results[0]["sig_zy_vy"])]})

                # výsledné smykového napětí od posouvající síly Vz
                self.__print_stresses(stress_post, "stress_post.plot_stress_vy_zxy()",
                                      "stress_sigma_zxy_Vy_section.svg")
                stress_pictures_sources.append("stress_sigma_zxy_Vy_section.svg")
                stress_pictures_names.append("Smykové napětí od Vz")
                stresses.update({"sig_zxy_vy": [min(stress_results[0]["sig_zxy_vy"]),
                                                max(stress_results[0]["sig_zxy_vy"])]})

                # stress_post.plot_vector_vy_zxy()    # tok výsledného smykového napětí od posouvající síly Vy
        # -------------- POSOUVAJÍCÍ SÍLY ----------------------------------------------------

        # -------------- CELKOVÁ NAPĚTÍ ------------------------------------------------------
        normal_stresses = bending_moments + float(internal_forces["Nxx"])

        if self.__calculate_options["sigma_tau"] == "yes":
            if normal_stresses != 0:
                # složené normálové napětí ze všech zatížení
                self.__print_stresses(stress_post, "stress_post.plot_stress_zz()", "stress_sigma_zz_section.svg")
                stress_pictures_sources.append("stress_sigma_zz_section.svg")
                stress_pictures_names.append("Celkové normálové napětí")
                stresses.update({"sig_zz": [min(stress_results[0]["sig_zz"]), max(stress_results[0]["sig_zz"])]})

            shear_stresses = float(internal_forces["Mxx"]) + shear_forces

            if shear_stresses != 0:
                if self.__calculate_options["stress_axis"] == "yes":
                    # x-ová složka složené smykové napětí ze všech zatížení
                    self.__print_stresses(stress_post, "stress_post.plot_stress_zx()", "stress_sigma_zx_section.svg")
                    stress_pictures_sources.append("stress_sigma_zx_section.svg")
                    stress_pictures_names.append("Celkkové smykové napětí, směr y")
                    stresses.update({"sig_zx": [min(stress_results[0]["sig_zx"]), max(stress_results[0]["sig_zx"])]})

                    # y-ová složka složené smykové napětí ze všech zatížení
                    self.__print_stresses(stress_post, "stress_post.plot_stress_zy()", "stress_sigma_zy_section.svg")
                    stress_pictures_sources.append("stress_sigma_zy_section.svg")
                    stress_pictures_names.append("Celkové smykové napětí, směr z")
                    stresses.update({"sig_zy": [min(stress_results[0]["sig_zy"]), max(stress_results[0]["sig_zy"])]})

                # složené smykové napětí ze všech zatížení
                self.__print_stresses(stress_post, "stress_post.plot_stress_zxy()", "stress_sigma_zxy_section.svg")
                stress_pictures_sources.append("stress_sigma_zxy_section.svg")
                stress_pictures_names.append("Celkové smykové napětí")
                stresses.update({"sig_zxy": [min(stress_results[0]["sig_zxy"]), max(stress_results[0]["sig_zxy"])]})

                # stress_post.plot_vector_zxy()   # tok složeného smykového napětí ze všech zatížení

        if self.__calculate_options["von_mises"] == "yes":
            # von Misesovo napětí
            self.__print_stresses(stress_post, "stress_post.plot_stress_vm()", "stress_sigma_vM_section.svg")
            stress_pictures_sources.append("stress_sigma_vM_section.svg")
            stress_pictures_names.append("Von Misesovo napětí")
            stresses.update({"sig_vm": [min(stress_results[0]["sig_vm"]), max(stress_results[0]["sig_vm"])]})
        # -------------- CELKOVÁ NAPĚTÍ ------------------------------------------------------

        return stress_pictures_sources, stress_pictures_names, stresses

    def __print_stresses(self, stress_post, stresses, file):
        eval(stresses)
        picture_manager.unique_stress_picture(self.__time_hash, self.__proportions['dimension_type'], file)


def get_rolled_dimensions(section_type):
    # SSE pro získání hodnot dimenzí pro válcovaný průřez
    values = ''
    import_string = f'from .models import {section_type}Section'
    exec(import_string)
    data = eval(f'{section_type}Section.query.options(load_only("dimensions")).all()')

    for dimension in data:
        values += str(dimension.dimensions) + ', '

    values = values.rstrip(', ')

    yield "data:" + values + "\n\n"  # zaslání stringu dimenzí pro válcovaný průřez na stránku, konec SSE kanálu


def rolled_section(section_type, dimensions):
    import_string = f'from .models import {section_type}Section'
    exec(import_string)

    try:
        dim = int(float(dimensions))

    except ValueError:
        dim = str(dimensions)

    data = eval(f'{section_type}Section.query.filter_by(dimensions=dim).first()')

    return data


def get_welded_proportions(section_type):
    # SSE pro získání typu inputů pro svařovaný průřez
    values = ''
    import_string = f'from .models import {section_type}Section'
    exec(import_string)
    data = eval(f'{section_type}Section.query.first()')

    for key in ["h", "tw", "bfh", "tfh", "bfd", "tfd", "tf", "D"]:
        try:
            float(eval(f'data.{key}'))

            if eval(f'data.{key}') != 0:
                values += key + ', '

        except KeyError:
            print(f'{key} neexistuje!')

    values = values.rstrip(', ')

    if section_type == 'RHS':
        values += 'h'

    yield "data:" + values + "\n\n"  # zaslání listu inputů pro svařovaný průřez na stránku, konec SSE kanálu


# uloží soubory průřezu tím, že je přesune z temp složky o úroveň výš (temp bude průběžně promazávána scriptem)
def save_cross_section(identifier, time_id, dim_type):
    print("Dim_type: ", dim_type)
    directory = os.getcwd() + r"/root/sections/saved_sections/temp/"
    new_directory = directory.replace('temp', identifier)

    if not os.path.exists(new_directory):
        os.makedirs(new_directory)

    print("Vytvořena složka pro data průřezů.")
    saved_files = ['init_data', 'proportions', 'section']
    for f in saved_files:
        old_path = directory + f + time_id + '.bin'
        new_path = new_directory + f + time_id + '.bin'

        try:
            Path(old_path).rename(new_path)

        except FileNotFoundError as e:
            return request_error(e)

    data = [SectionFiles.save_files(f"init_data{time_id}.bin", identifier, ''),
            SectionFiles.save_files(f"section{time_id}.bin", identifier, ''),
            SectionFiles.save_files(f"proportions{time_id}.bin", identifier, '')]

    picture_manager.save_picture(time_id, dim_type, identifier)

    time_hash = f"{dim_type}_" + datetime.datetime.now().strftime("%d-%m_%H-%M")
    image = SectionFiles.save_files(f'image{dim_type}{time_id}.svg', identifier, time_hash)
    data.append(image)

    print("--------------------------------------------------------NAHRÁNÍ DO DB------------------------------")
    try:
        root.db.session.bulk_save_objects(data)
        root.db.session.commit()
        print("Uloženo")
        u = Users.query.filter_by(identifier=identifier).first()
        users_files = len(SectionFiles.query.filter(SectionFiles.user_identifier == u.identifier).all())

        if users_files // 4 > 5:
            return request_error(SaveLimit)

        else:
            return str(5 - users_files // 4)

    except Exception as e:
        return db_error(e)


# přejmenuje uložený obrázek průřezu uživatele
def rename_cross_section_picture(old_name, new_name):
    try:
        this_picture = SectionFiles.query.filter(SectionFiles.alias == old_name).first()
        this_picture.alias = new_name
        root.db.session.commit()

        return "ok"

    except Exception as e:
        db_error(e)


# přejmenuje uložený obrázek průřezu uživatele
def delete_cross_section(identifier, time_id, dim_type):
    try:
        # problém s vlákny, když je toto mazání v jednom cyklu :(
        file_to_delete = SectionFiles.query.filter(SectionFiles.filename.like(f'%{time_id}%')).filter(
            SectionFiles.user_identifier == identifier).first()
        root.db.session.delete(file_to_delete)

        file_to_delete = SectionFiles.query.filter(SectionFiles.filename.like(f'%{time_id}%')).filter(
            SectionFiles.user_identifier == identifier).first()
        root.db.session.delete(file_to_delete)

        file_to_delete = SectionFiles.query.filter(SectionFiles.filename.like(f'%{time_id}%')).filter(
            SectionFiles.user_identifier == identifier).first()
        root.db.session.delete(file_to_delete)

        file_to_delete = SectionFiles.query.filter(SectionFiles.filename.like(f'%{time_id}%')).filter(
            SectionFiles.user_identifier == identifier).first()
        root.db.session.delete(file_to_delete)
        root.db.session.commit()

        picture_manager.delete_user_section(time_id, identifier, dim_type)
        cross_section_manager.delete_user_section(time_id, identifier)

        return "ok"

    except Exception as e:
        return db_error(e)
