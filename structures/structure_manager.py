import dill
import os
import root.static.pictures.picture_manager as picture_manager
from root.error_handlers import request_error, db_error, SaveLimit
from pathlib import Path
from root.models import *
from root.distinc_types import Tuple, Union


def save_temp_structure(actual_time: str, structure_data: dict) -> None:
    # uložení dat průřezu do souborů v adresáři temp v rootu
    struct_f = f'root/structures/saved_structures/temp/json_data{actual_time}.bin'

    with open(struct_f, 'wb') as s:    # nemusím psá řádek pro oper a pak ještě pro close
        s.write(dill.dumps(structure_data))
    # -----------------
    directory = 'root/structures/saved_structures/temp/'
    picture_manager.refresh_sections(directory)


# uloží soubory průřezu tím, že je přesune z temp složky o úroveň výš (temp bude průběžně promazávána scriptem)
def save_structure(identifier: str, time_id: str) -> str:
    directory = os.getcwd() + r'/root/structures/saved_structures/temp/'
    new_directory = directory.replace('temp', identifier)

    if not os.path.exists(new_directory):
        os.makedirs(new_directory)

    from root.static.pictures.picture_manager import save_picture

    print("Vytvořena složka pro data průřezů.")
    old_path = directory + "json_data" + time_id + '.bin'
    new_path = new_directory + "json_data" + time_id + '.bin'

    try:
        Path(old_path).rename(new_path)

    except FileNotFoundError:
        return request_error(FileNotFoundError)

    data = [StructureFiles.save_files(f"json_data{time_id}.bin", identifier, '')]

    actual_time = datetime.datetime.now().strftime("%d-%m_%H-%M")
    image = StructureFiles.save_files(f'structure{time_id}.svg', identifier, actual_time)
    data.append(image)
    save_picture(time_id, None, identifier)

    root.db.session.bulk_save_objects(data)

    try:
        root.db.session.commit()
        print("Uloženo")
        u = Users.query.filter_by(identifier=identifier).first()
        users_files = len(StructureFiles.query.filter(StructureFiles.user_identifier == u.identifier).all())

        if users_files // 2 > 2:
            return request_error(SaveLimit)

        else:
            return str(2 - users_files // 2)

    except AttributeError as e:
        return db_error(e)


def load_structure(username: str) -> Union[dict, str]:
    try:
        u = Users.query.filter_by(username=username).first()
        filenames = StructureFiles.query.filter(StructureFiles.user_identifier == u.identifier).filter(
            StructureFiles.filename.like("%.svg")).all()

    except AttributeError:
        return db_error()

    folder = f"./static/pictures/users/{u.identifier}/"
    files, names, data = list(), list(), list()

    for file in filenames:
        files.append(folder + file.filename)
        names.append(file.alias)

        structure_id = file.filename.split(".")[0].replace("structure", "")
        client_data = f"root/structures/saved_structures/{u.identifier}/json_data{structure_id}.bin"
        c = open(client_data, 'rb')
        c_data = c.read()
        c.close()
        client = dill.loads(c_data)
        data.append(client)

    if len(files) != 0:
        sections_identities = {"files": files, "names": names, "data": data}

        return sections_identities

    else:
        return "Aktuálně nemáš uložena žádná data."


# přejmenuje uložený obrázek průřezu uživatele
def rename_structure_picture(old_name: str, new_name: str) -> Tuple[str, int]:
    try:
        this_picture = StructureFiles.query.filter(StructureFiles.alias == old_name).first()
        this_picture.alias = new_name
        root.db.session.commit()

        return "ok", 200

    except AttributeError as e:
        return db_error(e)


# přejmenuje uložený obrázek průřezu uživatele
def delete_structure(identifier: str, time_id: str) -> Tuple[str, int]:
    try:
        # problém s vlákny, když je toto mazání v jednom cyklu :(
        files_to_delete = StructureFiles.query.filter(StructureFiles.filename.like(f'%{time_id}%')).filter(
            StructureFiles.user_identifier == identifier).all()

        for file in files_to_delete:
            root.db.session.delete(file)

        root.db.session.commit()

    except AttributeError as e:
        return db_error(e)

    picture_manager.delete_user_section(time_id, identifier, None)
    file = f'root/structures/saved_structures/{identifier}/json_data{time_id}.bin'
    os.remove(file)

    return "ok", 200
