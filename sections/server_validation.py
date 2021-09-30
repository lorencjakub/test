from root.sections.prepare_cross_section import MySection
from root.error_handlers import WrongSectionGeometry


def return_status(form_data):
    section = MySection(form_data)
    initial_data = section.get_initial_data()

    errors = 0
    problems = []
    status = ''

    for key in initial_data:

        """Pokud hodnota není číslo, je korektní pokud se rovná 'yes' nebo 'no'. Jediný další případ
        jsou označení dimenzí L a RHS profilů - ty se identifikují tak, že po splitu hodnoty podle 'x'
        se rozdělí na pouze dvě hodnoty, které se po úpravě desetinné čárky na tečku dají parsovat na float."""
        try:
            if float(initial_data[key]) or 'merged_hole' in key and float(initial_data[key]) != 0:

                if float(initial_data[key]) <= 0 and "shift" not in key and "merged" not in key and "rotate" not in key:
                    errors += 1
                    problems.append(ValueError)

                elif float(initial_data[key]) < 1 and "merged_hole" not in key and "rotate" not in key:
                    errors += 1
                    problems.append(ValueError)

                elif float(initial_data[key]) > 3000:
                    errors += 1
                    problems.append(ValueError)

                elif len(initial_data[key]) < 1:
                    errors += 1
                    problems.append(ValueError)

                elif len(initial_data[key]) > 5:
                    errors += 1
                    problems.append(ValueError)

                else:
                    if key in 'merged_hole_x, merged_hole_y':
                        continue

            elif initial_data[key] == "0" or initial_data[key] == "" or float(initial_data[key]) == 0:
                if "shift" not in key and "mirror" not in key and "merged_hole" not in key and "rotate" not in key:
                    errors += 1
                    problems.append(ValueError)

                elif "shift" in key:
                    if (initial_data["shift_x"] == "0" or initial_data["shift_x"] == "") and (
                            initial_data["shift_y"] == "0" or initial_data["shift_y"] == ""):
                        errors += 1
                        problems.append(WrongSectionGeometry)

                    else:
                        continue

                else:
                    continue

        except Exception:
            if key in 'allClickedPointsX, allClickedPointsY':
                if len(initial_data['allClickedPointsX']) > 3:
                    continue

                else:
                    errors += 1
                    problems.append(WrongSectionGeometry)

            elif initial_data[key] == "":
                if "shift" not in key and "mirror" not in key and "merged_hole" not in key and "rotate" not in key and "Points" not in key:
                    errors += 1
                    problems.append(ValueError)

                elif "shift" in key:
                    if (initial_data["shift_x"] == "0" or initial_data["shift_x"] == "") and (
                            initial_data["shift_y"] == "0" or initial_data["shift_y"] == "") or initial_data[key] == "":
                        errors += 1
                        problems.append(WrongSectionGeometry)

                    else:
                        continue

                else:
                    continue

            elif initial_data[key] in 'yes, no, on, ID' or 'dimension_type' in key or 'section_name' in key:
                continue

            elif key == "stressing_forces":
                continue

            elif key in 'allHolesPointsX, allHolesPointsY':
                if len(initial_data['allHolesPointsX']) != 0:
                    if len(initial_data['allHolesPointsX']) > 3:
                        continue

                    else:
                        errors += 1
                        problems.append(WrongSectionGeometry)

                else:
                    continue

            else:
                if 'mirror' not in key:
                    dimensions = initial_data[key].split('x')

                    if initial_data[key] in dimensions:
                        initial_data[key].replace(',', '.')

                    try:
                        if 'merged_hole' in key or float(dimensions[0]) and float(dimensions[1])\
                                and len(dimensions) == 2:
                            continue

                    except:
                        errors += 1
                        problems.append(ValueError)

    """Kontrola statusu. Pokud se nevyskytly žádné chyby, je status 'ok', v opačném případě
    se z listu 'problems' určí, jakým způsobem jsou vstupy nekorektní."""

    if errors == 0:
        status = 'ok'

    else:
        status = list(set([error for error in problems if error is not ValueError]))

    return status
