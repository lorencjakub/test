import time
import os
import root


def unique_picture(actual_time, dim_type, section_origin, picture):
    """Funkce pro tvorbu výsledkových obrázků. Obrázek průřezu je pomocí matplotlibu vyplotován a uložen do
    /static/pictures/work/ jako section.svg. Tato funkce mu poté přířadí idenifikátor složený z typu průřezu
    a aktuálního času v sekundách v číselném formátu. Přejmenuje obrázek v adresáři s tímto identifikátorem, který
    se zároveň předá stránce, která jej díky tomu načte. """

    directory = root.app.static_folder + '/pictures/users/temp'

    if picture == "centroid":
        # doplní cestu na výsledkový obrázek
        old_file = os.path.join(directory, "Centroidssection.svg")   # najde čerstvě vyplotovaný obrázek
        new_name = f'section{dim_type}{actual_time}.svg'    # zvolí pro něj nový název
        new_file = os.path.join(directory, new_name)    # vytvoří cestu pro obrázek s novým názvem
        os.rename(old_file, new_file)   # přejmenuje obrázek

        old_pdf_file = os.path.join(directory, "CentroidssectionPDF.svg")
        new_pdf_file = os.path.join(directory, new_name.replace('.svg', 'PDF.svg'))
        os.rename(old_pdf_file, new_pdf_file);

    elif picture == "mesh":
        if section_origin != 'loaded':
            # to stejné pro uživatelský obrázek
            old_file = os.path.join(directory, "Meshsection.svg")
            new_name = f"user_section{dim_type}{actual_time}.svg"
            new_file = os.path.join(directory, new_name)
            os.rename(old_file, new_file)


def unique_stress_picture(actual_time, dim_type, file):
    """Funkce pro tvorbu výsledkových obrázků. Obrázek průřezu je pomocí matplotlibu vyplotován a uložen do
    /static/pictures/work/ jako section.svg. Tato funkce mu poté přířadí idenifikátor složený z typu průřezu
    a aktuálního času v sekundách v číselném formátu. Přejmenuje obrázek v adresáři s tímto identifikátorem, který
    se zároveň předá stránce, která jej díky tomu načte. """

    directory = root.app.static_folder + '/pictures/users/temp'
    old_file = os.path.join(directory, file)   # najde čerstvě vyplotovaný obrázek
    new_name = f'{dim_type}{actual_time}{file}'    # zvolí pro něj nový název
    new_file = os.path.join(directory, new_name)    # vytvoří cestu pro obrázek s novým názvem
    os.rename(old_file, new_file)   # přejmenuje obrázek



def refresh_sections(directory):
    """Funkce pro mazání obrázků. Je spuštěna vždy před výpočtem. Pokud se v pracovním adresáři nachází obrázek
    section.svg (nově vyplotovaný obráázek před přidělením identifikátoru), smaže ho, jinak by se před dokončením
    výpočtu nemohl vyplotovat aktuální obrázek. Dále zkontroluje všechny obrázky v adresáři a smaže ty, které byly
    vytvořeny před více než pěti minutami."""

    if 'pictures' in directory:     # tzn. refresher je volán na obrázky
        myfile = root.app.static_folder + "/pictures/users/temp/section.svg"
        if os.path.isfile(myfile):  # pokud je vyplotovaný obrázek section.svg (vrací True)
            os.remove(myfile)       # odstraní ho

    files = []
    for r, d, f in os.walk(directory):
        for file in f:
            files.append(os.path.join(r, file))     # do listu "files" uloží absolutní cesty ke všem souborům

    for f in files:
        create_date = os.path.getctime(f)  # podle listu "files" zjisti datum vytvoření každého souboru (číselný formát)
        actual_time = time.time()           # zjistí aktuální čas v číselném formátu

        if (actual_time - create_date) > 300:   # pokud je soubor starší než 5 minut, smaže ho
            os.remove(f)


def save_picture(time_id, dim_type, identifier):
    picture = f'user_section{dim_type}{time_id}.svg'
    # obrázek z právě proběhlého výpočtu
    directory = root.app.static_folder + r'/pictures/users/temp'
    new_directory = directory.replace('temp', identifier)

    if not os.path.exists(new_directory):
        os.makedirs(new_directory)

    old_file = os.path.join(directory, picture).replace("user_", "")   # najde cestu k obrázku
    # vytvoří cestu pro obrázek s novým názvem
    new_file = directory.replace('temp', identifier) + r"/" + picture.replace("user_section", "image")
    os.rename(old_file, new_file)   # přejmenuje obrázek

    return picture


def delete_user_section(time_id, identifier, dim_type):
    file = root.app.static_folder + f'/pictures/users/{identifier}/image{dim_type}{time_id}.svg'
    os.remove(file)

    return "200"
