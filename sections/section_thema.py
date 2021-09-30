from flask import render_template, make_response, Response, request, session, jsonify
from root import sections
from .models import SectionFiles
from root.users.models import Users
import re
from root.error_handlers import *

section_thema = sections.section_page


@section_thema.route("/section_properties")
def section_page():
    # stránka pro výpočet průřezových charakteristik a práci s průřezy
    template = "section_page_full.html" if "user" in session else "section_page_basic.html"

    return render_template(template)


@section_thema.route("/section_theory")
def section_theory():
    # stránka pro teorii průřezových charakteristik

    return render_template("cross_sections_theory.html")


@section_thema.route("/section_stresses")
def section_stresses():
    # stránka pro analýzu napětí na průřezech

    return render_template("section_stresses.html") if "user" in session else request_error(AuthError)


@section_thema.route('/section_calculate_<form_data>', methods=['GET'])
def section_calculate(form_data):
    form_data.replace(',', '.')

    # validity check na serveru, vrací status ("ok", případně typ chyby)
    status = sections.server_validation.return_status(form_data)

    if status == 'ok':
        # server - sent event pro výpočet
        if "user" in session:
            return Response(sections.server_sent_events.calculate(form_data, 'logged'), mimetype='text/event-stream')

        else:
            return Response(sections.server_sent_events.calculate(form_data, 'nologged'), mimetype='text/event-stream')

    else:
        return request_error(status[0])


@section_thema.route('/rolled_values_<section_type>', methods=['GET'])
def rolled_values(section_type):
    # SSE pro získání hodnot dimenzí pro válcovaný průřez
    return Response(sections.server_sent_events.get_rolled_dimensions(section_type),
                    mimetype='text/event-stream')


@section_thema.route('/welded_values_<section_type>', methods=['GET'])
def welded_values(section_type):
    # SSE pro získání typu inputů pro svařovaný průřez
    return Response(sections.server_sent_events.get_welded_proportions(section_type), mimetype='text/event-stream')


@section_thema.route('/section_<action>', methods=["POST", "GET"])
def section_manipulate(action):
    if "user" not in session:
        return request_error(AuthError)

    picture_data = request.json['msg'].split('section')[1] if action == "save" \
        else request.json['msg'].replace('image', '')

    try:
        # Najde v picture_data první index, na kterém se nachází číslo, a podle něj string rozdělí.
        split_index = re.search(r"\d", picture_data).start()
        dim_type = picture_data[:split_index]
        time_id = picture_data[split_index:]
        int(time_id)

    except AttributeError or ValueError:
        return request_error(WrongDataError)

    try:
        identifier = Users.query.filter_by(username=session['user']['username']).first().identifier
        u = Users.query.filter_by(identifier=identifier).first()
        users_files = len(SectionFiles.query.filter(SectionFiles.user_identifier == u.identifier).all())

    except AttributeError as e:
        return db_error(e)

    if action == "save" and users_files // 4 >= 5:
        return request_error(SaveLimit)

    status = eval(f"sections.server_sent_events.{action}_cross_section(identifier, time_id, dim_type)")

    return status


@section_thema.route('/rename_user_section', methods=['POST'])
def rename_user_section():
    if "user" not in session:
        return request_error(AuthError)

    old_name = request.json['oldName'].replace('<p>', '').replace('</p>', '')
    new_name = request.json['newName']

    status = sections.server_sent_events.rename_cross_section_picture(old_name, new_name)

    return status


@section_thema.route('/load_section', methods=['POST'])
def load_section():
    if "user" not in session:
        return request_error(AuthError)

    user_files = 0

    try:
        u = Users.query.filter_by(username=session['user']['username']).first()
        filenames = SectionFiles.query.filter(SectionFiles.user_identifier == u.identifier).filter(
            SectionFiles.filename.like("%.svg")).all()

    except AttributeError:
        return db_error()

    folder = f"./static/pictures/users/{u.identifier}/"
    files = []
    names = []

    for i in range(len(filenames)):
        files.append(folder + filenames[i].filename)
        names.append(filenames[i].alias)

    if len(files) != 0:
        sections_identities = {'files': files, 'names': names}

        return jsonify(sections_identities)

    else:
        return "Aktuálně nemáš uložena žádná data."
