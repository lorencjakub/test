import dill
import os
import root.static.pictures.picture_manager as picture_manager


def save_temp_cross_section(section, initial_data, proportions, actual_time):
    # uložení dat průřezu do souborů v adresáři temp v rootu
    sec_f = f'root/sections/saved_sections/temp/section{actual_time}.bin'

    with open(sec_f, 'wb') as s:    # nemusím psá řádek pro oper a pak ještě pro close
        s.write(dill.dumps(section))

    # alternativa:
    init = open(f'root/sections/saved_sections/temp/init_data{actual_time}.bin', 'wb')

    with init:
        init.write(dill.dumps(initial_data))

    # původní kód:
    prop_f = open(f'root/sections/saved_sections/temp/proportions{actual_time}.bin', 'wb')
    prop_f.write(dill.dumps(proportions))
    prop_f.close()

    # -----------------
    directory = 'root/sections/saved_sections/temp/'
    picture_manager.refresh_sections(directory)


def load_cross_section(identifier, files):
    sec_f = open(f'root/sections/saved_sections/{identifier}/{files[1]}', 'rb')
    sec_data = sec_f.read()
    sec_f.close()
    section = dill.loads(sec_data)

    init_f = open(f'root/sections/saved_sections/{identifier}/{files[0]}', 'rb')
    init_data = init_f.read()
    init_f.close()
    initial_data = dill.loads(init_data)

    prop_f = open(f'root/sections/saved_sections/{identifier}/{files[2]}', 'rb')
    prop_data = prop_f.read()
    prop_f.close()
    proportions = dill.loads(prop_data)

    return section, initial_data, proportions


def delete_user_section(time_id, identifier):
    file = f'root/sections/saved_sections/{identifier}/init_data{time_id}.bin'
    os.remove(file)

    file = f'root/sections/saved_sections/{identifier}/proportions{time_id}.bin'
    os.remove(file)

    file = f'root/sections/saved_sections/{identifier}/section{time_id}.bin'
    os.remove(file)

    return "200"
