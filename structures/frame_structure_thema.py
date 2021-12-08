from flask import session, Response, request
from root import structures
import json
import re
import time
from root.error_handlers import *
from .server_sent_events import calculate_structure, save_temp_structure
from root.models import *
from . import structure_manager, server_validation
from root.distinc_types import WebTemplate, JsonDict, Tuple


frame_structure_thema = structures.frame_structure_page


@frame_structure_thema.route("/frame_structure_analysis")
def frame_structure_page() -> WebTemplate:
    # stránka pro analýzu 2D prutové konstrukce
    if "user" in session:
        return render_template("frame_structure_calculate.html")

    else:
        return render_template("404.html"), 404


@frame_structure_thema.route("/frame_structure_theory")
def structure_theory() -> WebTemplate:
    # stránka pro teorii k prutovým konstrukcím

    return render_template("frame_structure_theory.html")


@frame_structure_thema.route('/structure_calculate_<form_data>', methods=["POST", "GET"])
def structure_progress(form_data: JsonDict) -> JsonDict:
    structure_data = json.loads(form_data)
    # data = False if isinstance(structure_data, str) else True
    data_validation = server_validation.ServerValidation(structure_data)
    problem_in_structure = data_validation.get_problems()

    time_id = str(round(time.time(), 0)).replace('.0', '')

    if not problem_in_structure:
        return Response(calculate_structure(structure_data, time_id), mimetype='text/event-stream')

    else:
        return Response(structure_error_response(problem_in_structure, structure_data), mimetype='text/event-stream')


def structure_error_response(problem_in_structure, structure_data):
    yield f"data:{json.dumps([problem_in_structure, structure_data])}\n\n"


@frame_structure_thema.route('/structure_<action>', methods=["POST", "GET"])
def structure_manipulate(action: str) -> Tuple[str, int]:
    if "user" not in session:
        return request_error(AuthError)

    structure_data = request.json['msg']

    try:
        structure_data = json.loads(structure_data)

    except json.decoder.JSONDecodeError:
        structure_data = structure_data

    try:
        identifier = Users.query.filter_by(username=session['user']['username']).first().identifier
        u = Users.query.filter_by(identifier=identifier).first()
        users_files = len(StructureFiles.query.filter(StructureFiles.user_identifier == u.identifier).all())

    except AttributeError as e:
        return db_error(e)

    if action == "save" and users_files // 2 >= 2:
        return request_error(SaveLimit)

    if isinstance(structure_data, str):
        try:
            # Najde v structure_data první index, na kterém se nachází číslo, a podle něj string rozdělí.
            if len(structure_data.split("_")) > 1:
                structure_identifier = structure_data.split("_")[-2]
                split_index = re.search(r"\d", structure_identifier).start()
                time_id = structure_identifier[split_index:]

            else:
                split_index = re.search(r"\d", structure_data).start()
                time_id = structure_data[split_index:]

            int(time_id)

        except AttributeError or ValueError:
            return request_error(WrongDataError)

    elif action != "delete":
        time_id = str(round(time.time(), 0)).replace('.0', '')
        save_temp_structure(time_id, structure_data)
        data_validation = server_validation.ServerValidation(structure_data)
        problem_in_structure = data_validation.get_problems()

        if not problem_in_structure:
            structures.server_sent_events.create_structure(structure_data, time_id)

        else:
            return "Akce zablokována validací - lze uložit pouze korektně zadané konstrukce.", 400

    status = eval(f"structures.server_sent_events.{action}_structure(identifier, time_id)")

    return status if isinstance(status, tuple) else (status, 200)


@frame_structure_thema.route('/load_structures', methods=['POST'])
def load_structures() -> str:
    if "user" not in session:
        return request_error(AuthError)

    else:
        username = session['user']['username']
        load_status = root.structures.structure_manager.load_structure(username)

    return jsonify(load_status)


@frame_structure_thema.route('/rename_user_structure', methods=['POST'])
def rename_user_structure() -> str:
    if "user" not in session:
        return request_error(AuthError)

    old_name = request.json['oldName'].replace('<p>', '').replace('</p>', '')
    new_name = request.json['newName']

    rename_status = structures.structure_manager.rename_structure_picture(old_name, new_name)

    return str(rename_status)


@frame_structure_thema.route('/material_<action>', methods=["POST", "GET"])
def material_manipulate(action: str) -> Tuple[str, int]:
    if "user" not in session:
        return request_error(AuthError)

    material_data = request.json['msg']
    data_validation = server_validation.ServerValidation(material_data)
    problem_in_structure = data_validation.get_problems(parts=["materials"])

    if problem_in_structure:
        return "Akce zablokována validací - lze uložit pouze korektně zadané materiály.", 400

    try:
        identifier = Users.query.filter_by(username=session['user']['username']).first().identifier
        u = Users.query.filter_by(identifier=identifier).first()
        users_files = len(MaterialsData.query.filter(MaterialsData.user_identifier == u.identifier).all())

    except AttributeError as e:
        return db_error(e)

    if action == "save" and users_files >= 10:
        return request_error(SaveLimit)

    if action == "delete":
        material_data = material_data.split("|")

        try:
            my_material = MaterialsData.query.filter(MaterialsData.user_identifier == u.identifier).filter(
                MaterialsData.name == material_data[0]).filter(MaterialsData.young == material_data[1]).filter(
                MaterialsData.weight == material_data[2]).first()

            db.session.delete(my_material)
            db.session.commit()

        except AttributeError or ValueError:
            return request_error(WrongDataError)

    else:
        material = material_data.split("|") if isinstance(material_data, str) else list(material_data.values())
        my_material = []

        try:
            my_material.extend(MaterialsData.query.filter(MaterialsData.user_identifier == u.identifier).filter(
                MaterialsData.name == material[0]).filter(MaterialsData.young == float(material[1])).filter(
                MaterialsData.weight == float(material[2])).all())

        except Exception as e:
            db_error(e)

        if len(my_material) != 0:
            return "Zablokování duplicity - tento materiál už uložený máš.", 400

        data_validation = server_validation.ServerValidation(material_data)
        problem_in_structure = data_validation.get_problems(["materials"])

        if not problem_in_structure:
            material_data["user_identifier"] = identifier
            m = MaterialsData.save_files(**material_data)
            db.session.add(m)

            try:
                db.session.commit()
                users_files += 1

            except Exception as e:
                db_error(e)

        else:
            return "Akce zablokována validací - lze uložit pouze korektně zadaný materiál.", 400

    return str(10 - users_files), 200


@frame_structure_thema.route('/load_materials', methods=['GET'])
def load_materials() -> Tuple[str, int]:
    load_status = []

    if "user" not in session:
        return request_error(AuthError)

    else:
        materials = []

        try:
            identifier = Users.query.filter_by(username=session['user']['username']).first().identifier
            materials = MaterialsData.query.filter(MaterialsData.user_identifier == identifier).all()

        except Exception as e:
            db_error(e)

        if len(materials) == 0:
            return "Aktuálně nemáš uložená žádná data.", 400

        else:
            for material in materials:
                loaded_material = dict()
                loaded_material["name"] = material.name
                loaded_material["young"] = material.young
                loaded_material["weight"] = material.weight

                load_status.append(loaded_material)

    return json.dumps(load_status), 200


@frame_structure_thema.route('/rename_user_material', methods=['POST'])
def rename_user_material() -> Tuple[str, int]:
    if "user" not in session:
        return request_error(AuthError)

    old_values = request.json['oldName'].split("|")
    new_values = request.json['newName'].split("|")

    data_validation = server_validation.ServerValidation({
        "name": new_values[0],
        "young": new_values[1],
        "weight": new_values[2]
    })
    problem_in_structure = data_validation.get_problems(parts=["materials"])

    if problem_in_structure:
        return "Akce zablokována validací - lze uložit pouze korektně zadané materiály.", 400


    try:
        identifier = Users.query.filter_by(username=session['user']['username']).first().identifier

    except AttributeError as e:
        return db_error(e)

    try:
        my_material = MaterialsData.query.filter(MaterialsData.user_identifier == identifier).filter(
            MaterialsData.name == old_values[0]).filter(MaterialsData.young == old_values[1]).filter(
            MaterialsData.weight == old_values[2]).first()

        my_material.name = new_values[0]
        my_material.young = new_values[1]
        my_material.weight = new_values[2]

        db.session.commit()

        return "ok", 200

    except:
        return request_error(WrongDataError)
