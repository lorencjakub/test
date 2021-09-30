from root import sections


class DataGatherer:

    """vezme počáteční list průřezů, upraví ho dle typu průřezu a naplní daty z formuláře"""

    def __init__(self, initial_data,  part):
        self.initial_data = initial_data
        self.initial_proportions = None
        self.prepare_data(part)

    def prepare_data(self, part):
        if self.initial_data[f'dimension_type{part}'] == 'cnv':

            """vytáhnutí souřadnic bodů z canvasu"""

            self.initial_data[f'is_welded{part}'] = 'yes'

            self.initial_proportions = {
                'ID': 'ID',
                'dimension_type': 'cnv',
                'is_welded': 'yes',
                'x_coordinates': self.initial_data[f'allClickedPointsX{part}'],
                'y_coordinates': self.initial_data[f'allClickedPointsY{part}'],
                'x_holes': self.initial_data[f'allHolesPointsX{part}'],
                'y_holes': self.initial_data[f'allHolesPointsY{part}'],
                'FE_number': float(self.initial_data[f'FE_number{part}']),
                'n': '',
                'numberOfPoints': self.initial_data[f'numberOfPoints{part}'],
                'rotate': 'none',
                'mirror': 'none'
            }

            self.n_for_welded_section(self.initial_data, part)

        elif self.initial_data[f'dimension_type{part}'] == 'crl':
            self.initial_proportions = {
                f'dimension_type{part}': self.initial_data[f'dimension_type{part}'],
                f'FE_number{part}': float(self.initial_data[f'FE_number{part}']),
                'ID': 'ID',
                f'D{part}': float(self.initial_data[f'D{part}']),
                'n': str(self.initial_data[f'D{part}']),
                f'is_welded{part}': self.initial_data[f'is_welded{part}'],
                f'rotate{part}': 'none',
                f'mirrored{part}': 'none'
            }

        elif self.initial_data[f'dimension_type{part}'] == 'rtg':
            self.initial_proportions = {
                f'dimension_type{part}': self.initial_data[f'dimension_type{part}'],
                f'FE_number{part}': float(self.initial_data[f'FE_number{part}']),
                'ID': 'ID',
                f'h{part}': float(self.initial_data[f'h{part}']),
                f'bfd{part}': float(self.initial_data[f'bfd{part}']),
                'n': str(self.initial_data[f'bfd{part}']) + ' x ' + str(self.initial_data[f'h{part}']),
                f'is_welded{part}': self.initial_data[f'is_welded{part}'],
                f'rotate{part}': 'none',
                f'mirrored{part}': 'none'
            }

        elif self.initial_data[f'is_welded{part}'] == 'yes':   # spustí funkce pro svařované průřezy
            self.initial_proportions = self.list_for_welded_section()  # tady se vymaže "n"
            initial_proportions = self.initial_data
            self.initial_proportions['n'] = self.n_for_welded_section(initial_proportions, part)
            # tady se vytvoří požadované "n"

        else:
            self.initial_proportions = self.list_for_rolled_section(part)

        if part == '_sec':
            self.initial_proportions.update([
                ('shift_x', float(self.initial_data['shift_x'])),
                ('shift_y', float(self.initial_data['shift_y']))
            ])

        if self.initial_data[f'dimension_type'] == "mrg":
            self.initial_proportions.update([
                ('merged_hole_x', self.initial_data['merged_hole_x']),
                ('merged_hole_y', self.initial_data['merged_hole_y'])
            ])

        for j in self.initial_proportions:
            """přetypuje na float ty hodnoty, na kterých to jde"""
            try:
                temp_var = float(self.initial_proportions[j])
                self.initial_proportions[j] = temp_var
            except:
                continue
        print("Done")

    def list_for_welded_section(self):
        self.initial_proportions = self.initial_data

        return self.initial_proportions

    def list_for_rolled_section(self, part):
        """naplní list pro válcované průřezy"""

        file_name = self.initial_data[f'dimension_type{part}']

        dimension = str(self.initial_data[f'dimension_val{part}'])

        """
        Nutné pro válcované průřezy v merged průřezu. Jakmile se dim_val změní na float, dostane
        i desetinné místo, které pak zůstává i při změně na string, včetně desetinné tečky, a 
        nedojde pak k nalezení průřezu v databázi.
        """

        data = sections.server_sent_events.rolled_section(file_name, dimension)

        for key in data.__dict__.keys():
            if key != '_sa_instance_state' and key != 'dimensions' and eval(f'data.{key}') != 0:
                try:
                    float(eval(f'data.{key}'))
                    value = eval(f'data.{key}')
                    self.initial_data[f'{key}'] = value

                except:
                    continue

        self.initial_data['n'] = self.initial_data[f'dimension_val{part}']

        return self.initial_data

    def n_for_welded_section(self, initial_proportions, part):
        """vytvoří označení dimenze pro svařované průřezy
        (dále slouží i jako část unikátního ID pro plotované obrázky)"""

        dim_type = self.initial_proportions[f'dimension_type{part}']

        if dim_type == 'IPE' or dim_type == 'HEB':
            self.initial_proportions['n'] = str(initial_proportions[f'bfh{part}']) + '/'\
                                            + str(initial_proportions[f'tfh{part}']) + '/'\
                                            + str(initial_proportions[f'h{part}']) + '/'\
                                            + str(initial_proportions[f'tw{part}'])

        elif dim_type == 'UPE':
            self.initial_proportions['n'] = str(initial_proportions[f'bfh{part}']) + '/'\
                                            + str(initial_proportions[f'tfh{part}']) + '/'\
                                            + str(initial_proportions[f'h{part}']) + '/'\
                                            + str(initial_proportions[f'tw{part}']) + '/'\
                                            + str(initial_proportions[f'bfd{part}']) + '/'\
                                            + str(initial_proportions[f'tfd{part}'])

        elif dim_type == 'RHS':
            self.initial_proportions['n'] = str(initial_proportions[f'bfh{part}']) + '/'\
                                            + str(initial_proportions[f'tfh{part}']) + '/'\
                                            + str(initial_proportions[f'h{part}']) + '/'\
                                            + str(initial_proportions[f'tw{part}'])

        elif dim_type == 'T_s':
            self.initial_proportions['n'] = str(initial_proportions[f'bfh{part}']) + '/'\
                                            + str(initial_proportions[f'tfh{part}']) + '/'\
                                            + str(initial_proportions[f'h{part}']) + '/'\
                                            + str(initial_proportions[f'tw{part}'])

        elif dim_type == 'L_s':
            self.initial_proportions['n'] = str(initial_proportions[f'bfh{part}']) + '/'\
                                            + str(initial_proportions[f'tfh{part}']) + '/'\
                                            + str(initial_proportions[f'h{part}']) + '/'\
                                            + str(initial_proportions[f'tw{part}'])

        elif dim_type == 'crl':
            self.initial_proportions['n'] = str(initial_proportions[f'D{part}'])

        elif dim_type == 'rtg':
            self.initial_proportions['n'] = str(initial_proportions[f'bfd{part}']) + ' x '\
                                            + str(initial_proportions[f'h{part}'])

        elif dim_type == 'cnv':
            n = "Obecný průřez"
            spec_number = self.initial_proportions['x_coordinates'][0:5]
            actual_id = self.initial_proportions['numberOfPoints'] + spec_number.replace(".", "") + 'ID'
            self.initial_proportions['ID'] = actual_id

        return self.initial_proportions['n']


def send_geometry(proportions, part):

    """Pokud je průřez svařovaný, tato funkce posílá do main_run připravená data pro zadání parametrického průřezu.
    Pokud je průřez válcovaný, tato funkce nedělá nic a do modulu cross_section_calculate se pošle list proportions,
    vytvořený pomocí class DataGatherer."""

    shift = []

    if proportions[f'is_welded{part}'] == 'yes':
        data = ParametricGeometryCreator(proportions, part)
        points = data.points
        holes = data.holes
        perimeter = data.perimeter
        control_points = data.control_points
        facets = data.facets
        shift = data.shift

    else:
        points = []
        holes = []
        perimeter = []
        control_points = []
        facets = []

        try:
            shift = [proportions['shift_x'], proportions['shift_y']]

        except:
            pass

        if part == '_fir':
            shift = [0, 0]

    return points, holes, perimeter, shift, control_points, facets


class ParametricGeometryCreator:
    """ při parametrickém přůřezu je třeba zadat knihovně pro FEM výpočet průřezu předat slovníky obsahující souřadnice
        bodů, seznam hran mezi body, a otvory
        Variables:
            points (list[list[float, float]]) – List of points (x, y) defining the vertices of the cross-section
            List listů bodů definovaných souřadnicemi [x, y]

            facets (list[list[int, int]]) – List of point index pairs (p1, p2) defining the edges of the cross-section
            List listů linií pomocí krajních bodů.

            holes (list[list[float, float]]) – List of points (x, y) defining the locations of holes within the
            cross-section. If there are no holes, provide an empty list [].
            List listů souřadnich bodů, které leží uvnitř otvorů.

            control_points (list[list[float, float]]) – A list of points (x, y) that define different regions of the
            cross-section. A control point is an arbitrary point within a region enclosed by facets.
            List listů bodů, které leží uvnitř hmotné geometrie průřezu. Slouží na rozlišení rozdílných průřezů
            při jejich mergování (spřažené průřezy).

            shift (list[float, float]) – Vector that shifts the cross-section by (x, y)
            List s posunem průřezu v x a y - důležité při mergování průřezů.

            perimeter (list[int]) – List of facet indices defining the perimeter of the cross-section
            List linií, které ohraničují průřez.
        """

    def __init__(self, proportions, part):
        self.points = list()
        self.facets = list()
        self.holes = list()
        self.perimeter = list()
        self.control_points = list()
        self.shift = [0, 0]
        self.part = part

        try:
            self.shift = [proportions['shift_x'], proportions['shift_y']]

        except:
            pass

        if part == '_fir':
            self.shift = [0, 0]

        self.proportions = proportions
        self.hole_points = list()
        dimension_type = proportions[f'dimension_type{part}']
        self.dim_type = dimension_type.lower()
        """ všechny písmena v dim_type se změní na malá, aby názvy proměnných a funkcí nezačínaly velkým pismenem dle
        standartu PEP 8"""
        self.create_complet_geometry(proportions)

    def create_complet_geometry(self, proportions):  # volá funkce na vytvoření geometrie a předává ji dál
        self.create_points_list(proportions)
        self.create_shapes(proportions)

    def create_points_list(self, proportions):  # vytvoří list points a holes

        if self.dim_type == 'ipe' or self.dim_type == 'heb':    # IPE a HEB mají stejnou geometrii, liší se jen čísly
            self.ipe_geometry(proportions)

        else:
            if self.dim_type == 'l_s':
                self.l_s_geometry(proportions)

            elif self.dim_type == 't_s':
                self.t_s_geometry(proportions)

            else:
                try:
                    eval('self.' + self.dim_type + '_geometry(proportions)')

                    """eval() dynamicky vytvoří název volané funkce podle typu průřezu a vrátí ho jako příkaz"""

                except:
                    pass

    def create_shapes(self, proportions):    # vytvoří list perimeter a facets
        if self.dim_type == 'rhs':
            for i in range(1, int(len(self.points) * 0.5) + 1):
                self.perimeter.append(i - 1)

            self.holes = [[0.5 * proportions[f'bfh{self.part}'], 0.5 * proportions[f'h{self.part}']]]

            for i in range(1, int(len(self.points) * 0.5)):  # spojnice bodů na obvodu
                self.facets.append([i - 1, i])
            self.facets.append([int(len(self.points) * 0.5) - 1, 0])

            for j in range(int(len(self.points) * 0.5) + 1, len(self.points)):  # spojnice bodů uvnitř
                self.facets.append([j - 1, j])
            self.facets.append([len(self.points) - 1, int(len(self.points) * 0.5)])

        else:
            if self.dim_type != 'cnv':
                for i in range(1, len(self.points)):
                    self.facets.append([i - 1, i])
                self.facets.append([len(self.points) - 1, 0])

                for j in range(0, len(self.facets) - 1):
                    self.perimeter.append(j)
                self.holes = []

            else:
                for i in range(1, len(self.points)):
                    self.facets.append([i - 1, i])
                self.facets.append([len(self.points) - 1, 0])

                for j in range(0, len(self.facets)):
                    self.perimeter.append(j)

                if len(self.hole_points) != 0:
                    for k in range(1, len(self.hole_points)):
                        self.facets.append([k + len(self.points) - 1, k + len(self.points)])
                    self.facets.append([len(self.hole_points) + len(self.points) - 1, len(self.points)])

                else:
                    self.hole_points = []

                self.points = self.points + self.hole_points

    def ipe_geometry(self, proportions):

        if proportions[f'bfh{self.part}'] > proportions[f'bfd{self.part}']:
            self.points = [
                [0.5 * proportions[f'bfh{self.part}'] - 0.5 * proportions[f'bfd{self.part}'] + self.shift[0],
                 0 + self.shift[1]],

                [0.5 * proportions[f'bfh{self.part}'] + 0.5 * proportions[f'bfd{self.part}'] + self.shift[0],
                 0 + self.shift[1]],

                [0.5 * proportions[f'bfh{self.part}'] + 0.5 * proportions[f'bfd{self.part}'] + self.shift[0],
                 proportions[f'tfd{self.part}'] + self.shift[1]],

                [0.5 * proportions[f'bfh{self.part}'] + 0.5 * proportions[f'tw{self.part}'] + self.shift[0],
                 proportions[f'tfd{self.part}'] + self.shift[1]],

                [0.5 * proportions[f'bfh{self.part}'] + 0.5 * proportions[f'tw{self.part}'] + self.shift[0],
                 proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]],

                [proportions[f'bfh{self.part}'] + self.shift[0],
                 proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]],

                [proportions[f'bfh{self.part}'] + self.shift[0],
                 proportions[f'h{self.part}'] + self.shift[1]],

                [0 + self.shift[0],
                 proportions[f'h{self.part}'] + self.shift[1]],

                [0 + self.shift[0],
                 proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]],

                [0.5 * proportions[f'bfh{self.part}'] - 0.5 * proportions[f'tw{self.part}'] + self.shift[0],
                 proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]],

                [0.5 * proportions[f'bfh{self.part}'] - 0.5 * proportions[f'tw{self.part}'] + self.shift[0],
                 proportions[f'tfd{self.part}'] + self.shift[1]],

                [0.5 * proportions[f'bfh{self.part}'] - 0.5 * proportions[f'bfd{self.part}'] + self.shift[0],
                 proportions[f'tfd{self.part}'] + self.shift[1]]
            ]

        else:
            self.points = [
                [0 + self.shift[0],
                 0 + self.shift[1]],

                [proportions[f'bfd{self.part}'] + self.shift[0],
                 0 + self.shift[1]],

                [proportions[f'bfd{self.part}'] + self.shift[0],
                 proportions[f'tfd{self.part}'] + self.shift[1]],

                [0.5 * proportions[f'bfd{self.part}'] + 0.5 * proportions[f'tw{self.part}'] + self.shift[0],
                 proportions[f'tfd{self.part}'] + self.shift[1]],

                [0.5 * proportions[f'bfd{self.part}'] + 0.5 * proportions[f'tw{self.part}'] + self.shift[0],
                 proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]],

                [0.5 * proportions[f'bfd{self.part}'] + 0.5 * proportions[f'bfh{self.part}'] + self.shift[0],
                 proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]],

                [0.5 * proportions[f'bfd{self.part}'] + 0.5 * proportions[f'bfh{self.part}'] + self.shift[0],
                 proportions[f'h{self.part}'] + self.shift[1]],

                [0.5 * proportions[f'bfd{self.part}'] - 0.5 * proportions[f'bfh{self.part}'] + self.shift[0],
                 proportions[f'h{self.part}'] + self.shift[1]],

                [0.5 * proportions[f'bfd{self.part}'] - 0.5 * proportions[f'bfh{self.part}'] + self.shift[0],
                 proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]],

                [0.5 * proportions[f'bfd{self.part}'] - 0.5 * proportions[f'tw{self.part}'] + self.shift[0],
                 proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]],

                [0.5 * proportions[f'bfd{self.part}'] - 0.5 * proportions[f'tw{self.part}'] + self.shift[0],
                 proportions[f'tfd{self.part}'] + self.shift[1]],

                [0 + self.shift[0],
                 proportions[f'tfd{self.part}'] + self.shift[1]]
                ]

        self.control_points = [0.5 * proportions[f'bfd{self.part}'] + self.shift[0],
                               0.5 * proportions[f'bfh{self.part}'] + self.shift[1]]

        self.holes = []

        return self.points, self.holes, self.control_points

    def upe_geometry(self, proportions):
        self.points = [
            [0 + self.shift[0],
             0 + self.shift[1]],

            [proportions[f'bfd{self.part}'] + self.shift[0],
             0 + self.shift[1]],

            [proportions[f'bfd{self.part}'] + self.shift[0],
             proportions[f'tfd{self.part}'] + self.shift[1]],

            [proportions[f'tw{self.part}'] + self.shift[0],
             proportions[f'tfd{self.part}'] + self.shift[1]],

            [proportions[f'tw{self.part}'] + self.shift[0],
             proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]],

            [proportions[f'bfh{self.part}'] + self.shift[0],
             proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]],

            [proportions[f'bfh{self.part}'] + self.shift[0],
             proportions[f'h{self.part}'] + self.shift[1]],

            [0 + self.shift[0],
             proportions[f'h{self.part}'] + self.shift[1]]
        ]

        self.control_points = [0.5 * proportions[f'tw{self.part}'] + self.shift[0],
                               0.5 * proportions[f'h{self.part}'] + self.shift[1]]

        self.holes = []

        return self.points, self.holes, self.control_points

    def t_s_geometry(self, proportions):
        self.points = [
            [0.5 * proportions[f'bfh{self.part}'] - 0.5 * proportions[f'tw{self.part}'] + self.shift[0],
             0 + self.shift[1]],

            [0.5 * proportions[f'bfh{self.part}'] + 0.5 * proportions[f'tw{self.part}'] + self.shift[0],
             0 + self.shift[1]],

            [0.5 * proportions[f'bfh{self.part}'] + 0.5 * proportions[f'tw{self.part}'] + self.shift[0],
             proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]],

            [proportions[f'bfh{self.part}'] + self.shift[0],
             proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]],

            [proportions[f'bfh{self.part}'] + self.shift[0],
             proportions[f'h{self.part}'] + self.shift[1]],

            [0 + self.shift[0],
             proportions[f'h{self.part}'] + self.shift[1]],

            [0 + self.shift[0],
             proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]],

            [0.5 * proportions[f'bfh{self.part}'] - 0.5 * proportions[f'tw{self.part}'] + self.shift[0],
             proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]]
            ]

        self.control_points = [0.5 * proportions[f'bfh{self.part}'] + self.shift[0],
                               proportions[f'h{self.part}'] - 0.5 * proportions[f'tfh{self.part}'] + self.shift[1]]

        self.holes = []

        return self.points, self.holes, self.control_points

    def l_s_geometry(self, proportions):
        self.points = [
            [0 + self.shift[0],
             0 + self.shift[1]],

            [proportions[f'bfh{self.part}'] + self.shift[0],
             0 + self.shift[1]],

            [proportions[f'bfh{self.part}'] + self.shift[0],
             proportions[f'tfh{self.part}'] + self.shift[1]],

            [proportions[f'tw{self.part}'] + self.shift[0],
             proportions[f'tfh{self.part}'] + self.shift[1]],

            [proportions[f'tw{self.part}'] + self.shift[0],
             proportions[f'h{self.part}'] + self.shift[1]],

            [0 + self.shift[0],
             proportions[f'h{self.part}'] + self.shift[1]]
            ]

        self.control_points = [0.5 * proportions[f'tw{self.part}'] + self.shift[0],
                               0.5 * proportions[f'tfh{self.part}'] + self.shift[1]]

        self.holes = []

        return self.points, self.holes, self.control_points

    def rhs_geometry(self, proportions):
        self.points = [
            [0 + self.shift[0],
             0 + self.shift[1]],

            [proportions[f'bfh{self.part}'] + self.shift[0],
             0 + self.shift[1]],

            [proportions[f'bfh{self.part}'] + self.shift[0],
             proportions[f'h{self.part}'] + self.shift[1]],

            [0 + self.shift[0],
             proportions[f'h{self.part}'] + self.shift[1]],

            [proportions[f'tw{self.part}'] + self.shift[0],
             proportions[f'tfh{self.part}'] + self.shift[1]],

            [proportions[f'bfh{self.part}'] - proportions[f'tw{self.part}'] + self.shift[0],
             proportions[f'tfh{self.part}'] + self.shift[1]],

            [proportions[f'bfh{self.part}'] - proportions[f'tw{self.part}'] + self.shift[0],
             proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]],

            [proportions[f'tw{self.part}'] + self.shift[0],
             proportions[f'h{self.part}'] - proportions[f'tfh{self.part}'] + self.shift[1]]
            ]

        self.control_points = [proportions[f'bfh{self.part}'] - 0.5 * proportions[f'tw{self.part}'] + self.shift[0],
                               0.5 * proportions[f'h{self.part}'] + self.shift[1]]

        self.holes = [0.5 * proportions[f'bfh{self.part}'] + self.shift[0],
                      0.5 * proportions[f'h{self.part}'] + self.shift[1]]

        return self.points, self.holes, self.control_points

    def cnv_geometry(self, proportions):
        x_coordinates = proportions['x_coordinates'].split(",")
        y_coordinates = proportions['y_coordinates'].split(",")
        x_holes = proportions['x_holes'].split(",")
        y_holes = proportions['y_holes'].split(",")

        i = 0
        while i < len(y_coordinates):
            y_coordinates[i] = float(y_coordinates[i]) * -1
            i += 1

        j = 0
        if y_holes[0] != '':
            while j < len(y_holes):
                y_holes[j] = float(y_holes[j]) * -1
                j += 1

        points = []
        k = 0
        while k < len(x_coordinates):
            points.append([float(x_coordinates[k]), float(y_coordinates[k])])
            # vytvoření listu bodů
            k += 1

        holes_x = list()
        holes_y = list()

        if x_holes[0] != '':
            m = 0
            while m < len(x_holes):
                self.hole_points.append([float(x_holes[m]), float(y_holes[m])])
                holes_x.append(float(x_holes[m]))
                holes_y.append(float(y_holes[m]))
                # vytvoření listu bodů otvorů
                m += 1

            hole_point_x = sum(holes_x) / len(holes_x)
            hole_point_y = sum(holes_y) / len(holes_y)

            self.holes = [[hole_point_x, hole_point_y]]

        else:
            self.holes = []
            self.hole_points = []

        if float(x_coordinates[0]) < float(x_coordinates[1]):
            control_x = float(x_coordinates[0]) + 1

        else:
            control_x = float(x_coordinates[0]) - 1

        if float(y_coordinates[0]) < float(y_coordinates[1]):
            control_y = float(y_coordinates[0]) - 1

        else:
            control_y = float(y_coordinates[0]) - 1

        self.control_points = [control_x, control_y]

        self.points = points

        return self.points, self.holes, self.hole_points, self.control_points
