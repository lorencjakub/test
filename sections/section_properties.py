# --- VÝPOČET PRŮŘEZOVÝCH CHARAKTERISTIK POMOCÍ KNIHOVNY A PŘÍDAVNÝCH FUNKCÍ---

import sectionproperties.pre.sections as sections
from math import sqrt


class CrossSectionForLibrary:
    def __init__(self, proportions, points, facets, holes, control_points, shift, perimeter, part):
        self.proportions = proportions
        self.points = points
        self.facets = facets
        self.holes = holes
        self.control_points = [control_points]
        self.shift = shift
        self.center_point = []

        if not self.shift:
            self.shift = [0, 0]

        self.perimeter = perimeter
        self.geometry = None
        self.mesh = None
        self.dim_type = proportions[f'dimension_type{part}']
        self.create_geometry_for_library(part)

    def create_geometry_for_library(self, part):
        if len(self.points) != 0:
            self.geometry = sections.CustomSection(self.points, self.facets, self.holes,
                                                   self.control_points, self.shift, self.perimeter)
            points_x = []
            points_y = []

            for point in self.points:
                points_x.append(float(point[0]))
                points_y.append(float(point[1]))

            self.center_point = [(max(points_x) - min(points_x)) / 2, (max(points_y) - min(points_y)) / 2]

        else:
            self.geometry, self.center_point = self.rolled_geometry(self.proportions, part)

        if part != '':
            # rotace průřezu
            angle = self.proportions[f'rotate{part}']

            if angle != 'none' and angle != '' and int(float(angle)) != 0:
                self.geometry.rotate_section(angle, self.center_point)

            # zrcadlení průřezu
            if self.proportions[f'mirrored{part}'] == 'none':
                self.proportions[f'mirrored{part}'] = 'no'

            axis = self.proportions[f'mirrored{part}']

            if axis != 'no':
                axis = axis[0]
                self.geometry.mirror_section(axis, self.center_point)

        return self.geometry

    def rolled_geometry(self, proportions, part):
        if self.dim_type == "IPE" or self.dim_type == "HEB":
            self.geometry = sections.ISection(d=proportions['h'], b=proportions['bfd'], t_f=proportions['tfd'],
                                              t_w=proportions['tw'], r=proportions['r'], n_r=8, shift=self.shift)
            # proměnná n_r značí počet prvků v radiusu mezi stojinou a pásnicí

            self.center_point = [proportions['bfd'] * 0.5 + self.shift[0], proportions['h'] * 0.5 + self.shift[1]]

        elif self.dim_type == "UPE":
            self.geometry = sections.PfcSection(d=proportions['h'], b=proportions['bfd'], t_f=proportions['tfd'],
                                                t_w=proportions['tw'], r=proportions['r'], n_r=8, shift=self.shift)
            # proměnná n_r značí počet prvků v radiusu mezi stojinou a pásnicí

            self.center_point = [proportions['bfd'] * 0.5 + self.shift[0], proportions['h'] * 0.5 + self.shift[1]]

        elif self.dim_type == "RHS":
            self.geometry = sections.Rhs(d=proportions['h'], b=proportions['bfh'], t=proportions['tf'],
                                         r_out=proportions['r'], n_r=8, shift=self.shift)
            # proměnná n_r značí počet prvků v radiusu mezi stojinou a pásnicí

            self.center_point = [proportions['bfh'] * 0.5 + self.shift[0], proportions['h'] * 0.5 + self.shift[1]]

        elif self.dim_type == "CHS":
            self.geometry = sections.Chs(d=proportions['D'], t=proportions['tf'], n=64, shift=self.shift)
            # proměnná n_r značí počet prvků v radiusu

            self.center_point = [proportions['D'] * 0.5 + self.shift[0], proportions['D'] * 0.5 + self.shift[1]]

        elif self.dim_type == "T_s":
            self.geometry = sections.TeeSection(d=proportions['h'], b=proportions['bfh'], t_f=proportions['tfh'],
                                                t_w=proportions['tw'], r=proportions['r'], n_r=8, shift=self.shift)
            # proměnná n_r značí počet prvků v radiusu mezi stojinou a pásnicí

            self.center_point = [proportions['bfh'] * 0.5 + self.shift[0], proportions['h'] * 0.5 + self.shift[1]]

        elif self.dim_type == "L_s":
            self.geometry = sections.AngleSection(d=proportions['h'], b=proportions['bfh'],
                                                  t=proportions['tfh'], r_r=proportions['r1'], r_t=proportions['r2'],
                                                  n_r=16, shift=self.shift)
            # proměnná n_r značí počet prvků v radiusu mezi stojinou a pásnicí

            self.center_point = [proportions['bfh'] * 0.5 + self.shift[0], proportions['h'] * 0.5 + self.shift[1]]

        elif self.dim_type == "crl":
            self.geometry = sections.CircularSection(d=proportions[f'D{part}'], n=64, shift=self.shift)
            # proměnná n_r značí počet prvků v radiusu

            self.center_point = [proportions[f'D{part}'] * 0.5 + self.shift[0],
                                 proportions[f'D{part}'] * 0.5 + self.shift[1]]

        elif self.dim_type == "rtg":
            self.geometry = sections.RectangularSection(d=proportions[f'h{part}'], b=proportions[f'bfd{part}'],
                                                        shift=self.shift)

            self.center_point = [proportions[f'bfd{part}'] * 0.5 + self.shift[0],
                                 proportions[f'h{part}'] * 0.5 + self.shift[1]]

        return self.geometry, self.center_point
        # vrací pro průřezovou knihovnu dictionary s geometrickým zadáním průřezu



class GimmeResultsBro:
    def __init__(self, section):
        self.section = section
        self.results = None
        self.run_for_results()

    def run_for_results(self):
        # aktivace knihovny, výpočet průřezu FEM meetodou, vytažení výsledků z knihovny

        """
        print('Počítám geometrické charakteristiky...')
        print('')
        self.section.calculate_geometric_properties()

        print('Počítám torzní a deplanační charakteristiky...')
        print('')
        self.section.calculate_warping_properties()

        print('Počítám plastické charakteristiky...')
        print('')
        self.section.calculate_plastic_properties()

        area = self.section.get_area()
        """

        # kvadratické momenty k těžištním osám):
        (ixx_c, iyy_c, ixy_c) = self.section.get_ic()

        # kvadratické momenty k hlavním osám:
        (i11_c, i22_c) = self.section.get_ip()

        # poloha těžiště pro pružné působení:
        (cx, cy) = self.section.get_c()

        # pružné průřezové moduly kolem těžišťových os:
        (zxx_plus, zxx_minus, zyy_plus, zyy_minus) = self.section.get_z()

        # plastické průřezové moduly kolem hlavních os:
        (z11_plus, z11_minus, z22_plus, z22_minus) = self.section.get_zp()

        # poloměry setrvačnosti kolem těžišťovýách os:
        (rx, ry) = self.section.get_rc()

        # poloměry setrvačnosti kolem hlavních os:
        (r11, r22) = self.section.get_rp()

        # natočení hlavních os:
        phi = self.section.get_phi()

        # Saint-Venantův torzní moment:
        j = self.section.get_j()

        # poloha středu smyku v těžištním systému:
        (x_se, y_se) = self.section.get_sc()

        """# poloha středu smyku v hlavním systému:
        (x11_se, y22_se) = self.section.get_sc_p()"""

        # výsečový moment setrvačnosti:
        gamma = self.section.get_gamma()

        # smykové plochy v těžištních osách:
        (A_sx, A_sy) = self.section.get_As()

        # smykové plochy v hlavních osách:
        (A_s11, A_s22) = self.section.get_As_p()

        """# součinitel nesymetrie v těžišťních osách:
        (beta_x_plus, beta_x_minus, beta_y_plus, beta_y_minus) = self.section.get_beta()

        # součinitel nesymetrie v hlavních osách:
        (beta_11_plus, beta_11_minus, beta_22_plus, beta_22_minus) = self.section.get_beta_p()

        # těžiště zplastizovaného průřezu v těžištňích osách:
        (x_pc, y_pc) = self.section.get_pc()

        # těžiště zplastizovaného průřezu v hlavních osách:
        (x11_pc, y22_pc) = self.section.get_pc_p()"""

        # plastické průřezové moduly v těžištních osách:
        (sxx, syy) = self.section.get_s()

        # plastické průřezové moduly v hlavních osách:
        (s11, s22) = self.section.get_sp()

        self.results = {
            # 'area': area,
            'in_mom_y': ixx_c,
            'in_mom_z': iyy_c,
            'in_mom_u': i11_c,
            'in_mom_v': i22_c,
            'dev_mom_yz': ixy_c,
            'zcgh': cx,
            'ycgl': cy,
            'wymax': zxx_plus,
            'wymin': zxx_minus,
            'wzmax': zyy_plus,
            'wzmin': zyy_minus,
            'wumax': z11_plus,
            'wumin': z11_minus,
            'wvmax': z22_plus,
            'wvmin': z22_minus,
            'alfa_deg': phi,
            'tors_moment': j,
            'shear_center_y': x_se,
            'shear_center_z': y_se,
            'in_mom_w': gamma,
            'shear_area_y': A_sx,
            'shear_area_z': A_sy,
            'shear_area_u': A_s11,
            'shear_area_v': A_s22,
            'wply': sxx,
            'wplz': syy,
            'wplu': s11,
            'wplv': s22,
            'in_rad_y': rx,
            'in_rad_z': ry,
            'in_rad_u': r11,
            'in_rad_v': r22
        }

        return self.results
        # vrací dictionary s připravenými výsledky průřezových charakteristik


class GetAllOfResults:
    def __init__(self, section, initial_data, proportions, area):
        self.section = section
        self.dim_type = proportions['dimension_type']

        if self.dim_type == 'mrg':
            self.weld = 'yes'

        else:
            self.weld = initial_data['is_welded']

        self.results = GimmeResultsBro(section).results
        area = area
        self.results.update({'area': area})

        if initial_data["warping_value"] == "yes":
            self.torsional_section_modulus(proportions)
            self.polar_moment_of_inertia()

    def torsional_section_modulus(self, proportions):
        # dopočítání torzního modulu průřezu
        if self.dim_type != "cnv" and self.dim_type != "mrg":
            if self.dim_type == 'chs':
                thicknesses = [proportions['tf']]

            elif self.dim_type == 'rtg':
                thicknesses = min(proportions['h'], proportions['bfd'])

            elif self.dim_type == 'crl' or self.dim_type == 'CHS':
                thicknesses = [proportions['D'] * 0.5]

            elif self.dim_type == 'L_s' or self.dim_type == 'T_s':
                thicknesses = [proportions['tfh'], proportions['tw']]

            elif self.dim_type == 'RHS':
                if proportions['is_welded'] != 'yes':
                    thicknesses = [proportions['tf'], proportions['tw']]

                else:
                    thicknesses = [proportions['tfh'], proportions['tw']]

            else:
                thicknesses = [proportions['tfh'], proportions['tw'], proportions['tfd']]

            if type(thicknesses) != float:
                tors_modulus = self.results['tors_moment'] / max(thicknesses)

            else:
                tors_modulus = self.results['tors_moment'] / thicknesses

        else:
            tors_modulus = 0

        self.results.update([('tors_modulus', tors_modulus)])

    def polar_moment_of_inertia(self):
        # dopočítání polárního momentu setvračnosti z hlavních kvadratickýých momentů průřezu
        cg_cs_distance = sqrt(pow(self.results['shear_center_y'] - self.results['zcgh'], 2) +
                              pow(self.results['shear_center_z'] - self.results['ycgl'], 2))
        polar_moment = self.results['in_mom_u'] + self.results['in_mom_v'] +\
            self.results['area'] * pow(cg_cs_distance, 2)

        in_rad_p = sqrt(polar_moment / self.results['area'])

        self.results.update([('polar_moment', polar_moment),
                             ('in_rad_p', in_rad_p)])
        # vrátí polární moment setvračnosti a polární poloměr setrvačnosti průřezu
