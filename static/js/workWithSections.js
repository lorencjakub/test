//--- MODUL OBSAHUJÍCÍ FUNKCE PRO PRÁCI NA STRÁNCE PRO VÝPOČET PRŮŘEZOVÝCH CHARAKTERISTIK - KONKRÉTNĚ VOLBU TYPU PRŮŘEZU A LOADING BAR PŘI VÝPOČTU ---//

// funkce volaná při kliknutí na switcher průřezů - vytvoří nebo smaže formulář vybraného průřezu
function createNewCrossSection(clicked_id) {
    let contentDiv = $('#selected_section_card')[0];

    if (clicked_id == 'nextSection') {
        return null;
    }

    let objectId = $(`#${clicked_id}`).prop('id').substr(0, 3);
    activeBigIcons(clicked_id, contentDiv);

    // pokud div průřezů neobsahuje žádné element, neexistují výsledky a funkce není volána close buttonem na existující kartě
    if ((contentDiv.children.length == 0) && (!$('#results')[0]) && (!clicked_id.includes('close'))) {
        crossSectionRun(clicked_id);
    }

    // pokud existují výsledky
    else if ($('#results')[0]) {
        // výsledky se smažou a vytvoří se volaná karta
        $('#crossSections')[0].removeChild($('#crossSections')[0].lastChild);
        crossSectionRun(clicked_id);
    }

    // funkce je volána close buttonem na existující kartě nebo je volán stejný průřez, jaký je již otevřen
    else if ((clicked_id.includes('close')) || (contentDiv.children[0].id.substr(0, 3) == clicked_id.substr(0, 3))) {
        $('#selected_section_card').collapse('toggle')

        setTimeout(function() {
            // data v divu průřezů se promažou
            while (contentDiv.firstChild) {
                contentDiv.removeChild(contentDiv.lastChild);
            }
            $('#section_content')[0].scrollIntoView();
        }, 500);  // skript počká, než se dokončí animace - ZDE MUSÍ BÝT STEJNÝ ČAS JAKO JE NASTAVEN PRO COLLAPSE ANIMACI KARTY
    }

    // merged průřez
    else if ($('#mrg_form')[0]) {
        let mergedPartialForms = $('[id*=_form_]'); // dílčí formuláře

        let clickedPart = clicked_id.substr(0, 3);
        let clickedObjectId = clicked_id.substr(-3, 3);
        let contentDiv = '';

        if (clickedPart == 'fir') {
            contentDiv = $('#first_cross_section');
        }

        else if (clickedPart == 'sec') {
            contentDiv = $('#second_cross_section');
        }

        // existuje merger průřez, ale je volán jiný
        else {
            contentDiv = $('#selected_section_card');
        }

        if (clicked_id != 'selectCreatorSection') {
            if (contentDiv[0].children.length == 0) {  // prázdný dílčí formulář -> vytvoření průřezu
                crossSectionRun(clicked_id);
                activeSmallIcons(clicked_id, contentDiv);
            }

            // na merged průřezu je volaný dílčí průřez do formuláře, kde již průřez existuje
            else {
                let part = contentDiv[0].children[0].children[0].children[0].id.substr(-3, 3);
                let objectId = contentDiv[0].children[0].children[0].children[0].id.substr(0, 3);

                contentDiv.collapse('toggle');

                setTimeout(function() {
                    // data v divu průřezů se promažou
                    while (contentDiv[0].firstChild) {
                        contentDiv[0].removeChild(contentDiv[0].lastChild);
                    }

                    // pokud nebyl volán stejný průřez, vytvoří se do prázdného dílčího divu nový
                    if ((clickedPart != part) || (clickedObjectId != objectId)) {
                        crossSectionRun(clicked_id);
                        contentDiv.collapse('toggle');
                    }

                    activeSmallIcons(clicked_id, contentDiv);
                }, 500);  // skript počká, než se dokončí animace - ZDE MUSÍ BÝT STEJNÝ ČAS JAKO JE NASTAVEN PRO COLLAPSE ANIMACI KARTY
            }
        }
    }

    else {  // je otevřena karta průřezu před odesláním na serveru a uživatel si vybírá jiný průřez nebo se jedná o merger průřez
        if ((!clicked_id.includes('fir')) && (!clicked_id.includes('sec'))) {   // není to merged průřez
            $('#selected_section_card').collapse('toggle')

            setTimeout(function() {
                // data v divu průřezů se promažou
                while (contentDiv.firstChild) {
                    contentDiv.removeChild(contentDiv.lastChild);
                }
                contentDiv.classList.add('hide');
                crossSectionRun(clicked_id);
            }, 800);  // skript počká, než se dokončí animace - ZDE MUSÍ BÝT STEJNÝ ČAS JAKO JE NASTAVEN PRO COLLAPSE ANIMACI KARTY
        }
    }


    function crossSectionRun(clicked_id) {
        // výraz zjiš´tující, jeslti string objectId obsahuje jeden ze zadaných substringů "fir" a "sec"
        if (!/fir|sec/.test(clicked_id)) {   // pokud není funkce volána z buttonu v merged průřezu

            if (objectId == 'cnv') {
                let crossSection = new CanvasCrossSection(clicked_id, '');  // vytvoření canvas objektu
            }

            else if (objectId == 'mrg') {
                let crossSection = new MergedCrossSection(clicked_id, '');  // vytvoření merged objektu
            }

            else {
                let crossSection = new CrossSectionObject(clicked_id, '', $("#selected_section_card")[0]);  // vytvoření objektu běžného průřezu
            }

            setTimeout(function() {
                $('#selected_section_card').collapse('toggle');
                setTimeout(function() {
                    $('[id$="_calculate"]')[$('[id$="_calculate"]').length - 1].scrollIntoView();
                }, 500);
            }, 500);  // skript počká, než se dokončí animace - ZDE MUSÍ BÝT STEJNÝ ČAS JAKO JE NASTAVEN PRO COLLAPSE ANIMACI KARTY
        }

        else {
            objectId == 'fir' ? contentDiv ='first_cross_section' : contentDiv ='second_cross_section';
            contentDiv = $(`#${contentDiv}`);

            if ((contentDiv[0].children.length == 0) || ($('#results')[0])) {      // pokud div průřezů neobsahuje žádné elementy nebo jsou na stránce výsledky
                let crossSection = new CrossSectionObject(clicked_id, objectId, $("#selected_section_card")[0]);

                setTimeout(function() {
                    contentDiv.collapse('toggle');
                    setTimeout(function() {
                        $(`#header_part_${objectId}`)[0].scrollIntoView();
                    }, 500);
                }, 500);
            }
        }
    }
}


// přidá nebo odstraní zvýraznění zvoleného průřezu na kartě průřezů v merged průřezu
function showCrossSections(clicked_id) {
    let selectedSection = document.getElementById(clicked_id);

    let pictures = $('[id^="merged_bar_switch_button_"]');

    for (i = 0; i < pictures.length; i++) {
        pictures[i].style.border = "1px solid #000000";
    }
}


// doplní potřebné údaje z formuláře prvního průřezu do finálního formuláře merged průřezu - nebo je z něj umaže, když se deaktivuje první průřez
function editFinalForm(clicked_id) {
    let sectionFormular = $('[id*="_form"]')[0];

    if (sectionFormular.id.includes('mrg')) {
        let partDiv = clicked_id.substr(0, 3);
        let part = '';
        let shiftDiv = $('#secondSectionShift')[0];

        // pokud se "fir"/"sec" nenachází na začátku ID, je na jeho konci
        if ((partDiv != 'fir') && (partDiv != 'sec')) {
            part = clicked_id.substr(-3, 3);
        }

        else {
            part = clicked_id.substr(0, 3);
        }

        // po zachycení části průřezu se určí proměnná část ID/name elementů
        if (part == 'fir') {
            partDiv = '_' + part;
            part = 'first';
        }

        else {
            partDiv = '_' + part;
            part = 'second';
        }

        if ((part.includes('fir')) || (part.includes('sec'))) {
            let controlInputs = $(`#${part}_cross_section [class*="form-control"]`);    // v daném dílčím formuláři vybere všechny form-control inputy

            if (controlInputs.length == 0) {
                controlInputs = $(`[name*=${partDiv}]`);
            }

            let finalMergedForm = $('#mrg_form')[0];     // finální formulář merged průřezu
            let submitOfForm = $('#mrg_calculate')[0];

            // nalezení shiftDivu ve finálním průřezu
            let i = 0

            let inputCheck = $(`#mrg_form [name*=${partDiv}]`);

            if (($(`#${part}_cross_section`)[0].children[0]) || ((!$(`#${part}_cross_section`)[0].children[0] && (inputCheck.length != 0)))) {  // pokud je dílčí formulář prázdný, je potřeba z finálního formuláře vymazat všechny inputy o něm
                let j = 0

                // zjistí index elementu ve finálním formuláři, který leží za divem posunu druhého průřezu - odsud se bude mazat
                while (finalMergedForm.children[j].id != 'second_cross_section') {
                    j++
                }

                let k = j + 1;

                while (finalMergedForm.children[k] != shiftDiv) {    // prochází elementy, dokud nenarazí na submit
                    if (finalMergedForm.children[k].name.includes(partDiv)) {       // pokud element patří ke kliknutému dílčímu průřezu, smaže ho
                        finalMergedForm.children[k].remove();
                        k = k;
                    }

                    else {
                        k += 1;
                    }
                }

                let divOfPartSection = '';

                if (part.includes('fir')) {
                    divOfPartSection = $('#mrg_form')[0].children[2];
                }

                else {
                    divOfPartSection = $('#mrg_form')[0].children[3];
                }

                // po smazání všech elementů příslušných k dílčímu průřezu se přidají nové s aktuálními hodnotami - neplatí, pokud part div je prázdný, ale finální formuláář obsahuje inputy tohoto divu
                if (divOfPartSection.children.length != 0) {
                    for (let l = 0; l < controlInputs.length; l++) {
                        let element = document.createElement('input');
                        element.setAttribute('type', 'hidden');
                        element.setAttribute('name', controlInputs[l].name);

                        if (controlInputs[l].value == '') {
                            element.value = 0;
                        }

                        else {
                            element.value = controlInputs[l].value;
                        }

                        finalMergedForm.insertBefore(element, shiftDiv)
                    }
                }
            }

            else {      // pokud existuje dílčí průřez, přidají se jeho form-control inputy do finálního formuláře, před div posunu 2. průřezu
                for (let m = 0; m < controlInputs.length; m++) {
                    let element = document.createElement('input');
                    element.setAttribute('type', 'hidden');
                    element.setAttribute('name', controlInputs[m].name);

                    if (controlInputs[m].value == '') {
                        element.value = 0;
                    }

                    else {
                        element.value = controlInputs[m].value;
                    }

                    finalMergedForm.insertBefore(element, shiftDiv)
                }
            }
        }

    /* Jelikož se funkce přidává s event listenerem na "change" na formulářích průřezů, je potřeba
     rozeznávat, jeslti je funkce volána z merged průřezu, nebo mimo něj. Pokud mimo něj, neudělá nic. */
    }

    else {
        return null;
    }
}


function activeBigIcons(clicked_id, contentDiv) {
    let bigIcons = $("img[id$='bar_switch']");
    freezeSectionIcons(bigIcons, '');

    for (i = 0; i < bigIcons.length; i++) {
        if (bigIcons[i].getAttribute('class').split(' ')[bigIcons[i].getAttribute('class').split(' ').length - 1] == 'activeBigIcon') {
            bigIcons[i].classList.remove('activeBigIcon');
        }
    }

    if (!clicked_id.includes('calculate')) {
        setTimeout(function() {
            if (contentDiv.children.length != 0) {
                $(`#${clicked_id}`)[0].classList.add('activeBigIcon');
            }
            freezeSectionIcons(bigIcons, '');
        }, 510);
    }
}


function activeSmallIcons(clicked_id) {
    let part = clicked_id.substr(0, 3);
    let smallIcons = $(`img[id^=${part}]`);
    freezeSectionIcons(smallIcons, part);
    let contentDiv = $('#selected_section_card')[0];

    clicked_id.includes("fir") ? contentDiv = $('#first_cross_section')[0] : contentDiv = $('#second_cross_section')[0];

    for (i = 0; i < smallIcons.length; i++) {
        smallIcons[i].classList.remove('activeSmallIcon');
    }

    setTimeout(function() {
        if (contentDiv.children.length != 0) {
            $(`#${clicked_id}`)[0].classList.add('activeSmallIcon');
        }
        freezeSectionIcons(smallIcons, part);
    }, 250);
}


// funkce pro přepínání switcheru rolled/welded průřezu
function activeSectionType(clicked_id) {
    let thisCheckbox = $(`#${clicked_id}`)[0];
    let switcherDiv = thisCheckbox.parentNode;
    let objectId = thisCheckbox.id.substr(7, 3);
    let part = clicked_id.substr(-4, 4);

    if (thisCheckbox.checked) {
        switcherDiv.children[0].classList.remove('activeOption');
        switcherDiv.children[0].classList.remove('px-1');

        switcherDiv.children[2].classList.add('activeOption');
        switcherDiv.children[2].classList.add('px-1');
        $(`#${clicked_id}`)[0].parentElement.parentElement.children[1].value = 'yes';
    }

    else {
        switcherDiv.children[2].classList.remove('activeOption');
        switcherDiv.children[2].classList.remove('px-1');

        switcherDiv.children[0].classList.add('activeOption');
        switcherDiv.children[0].classList.add('px-1');
        $(`#${clicked_id}`)[0].parentElement.parentElement.children[1].value = 'no';
    }
}


// funkce na zapnutí/vypnutí zrcadlení průřezu
function activeMirror(clicked_id) {
    let part = clicked_id.substr(-4, 4);
    let mirrorAxisDiv = $(`#mirror_axis${part}`)[0];
    let mirrorValue = $(`#mirrored${part}`)[0];

    if (mirrorAxisDiv.children.length != 0) {
        mirrorAxisDiv.innerHTML = '';
        mirrorValue.value = 'no';
    }

    else {
        addMirrorAxis(mirrorAxisDiv, part);
        mirrorValue.value = 'xAxe';
    }
}


// funkce pro přepínání switcheru os zrcadlení průřezu
function activeMirrorAxe(clicked_id) {
    let part = clicked_id.substr(-4, 4);
    let thisCheckbox = $(`#${clicked_id}`)[0];
    let switcherDiv = thisCheckbox.parentNode;
    let mirrorValue = $(`#mirrored${part}`)[0];

    if (thisCheckbox.checked) {
        switcherDiv.children[0].classList.remove('activeOption');
        switcherDiv.children[0].classList.remove('px-1');
        switcherDiv.children[2].classList.add('activeOption');
        switcherDiv.children[2].classList.add('px-1');
        mirrorValue.value = 'yAxe';
    }

    else {
        switcherDiv.children[2].classList.remove('activeOption');
        switcherDiv.children[2].classList.remove('px-1');
        switcherDiv.children[0].classList.add('activeOption');
        switcherDiv.children[0].classList.add('px-1');
        mirrorValue.value = 'xAxe';
    }
}


function nextSection(clicked_id) {
    $('#results').collapse('toggle');

    if (/stresses|frame/.test(window.location.href)) {
        // restart button, neexistují výsledky
        if ($('#stressedCrossSections')[0].children.length == 1) {
            restartStressFormular(clicked_id, '');
        }

        else {  // existují výsledky, Nový průřez button
            setTimeout(function() {
                restartStressFormular(clicked_id, 'armageddon');
            }, 800);
        }
    }

    else {
        setTimeout(function() {
            $('#section_content').collapse('toggle');
                createNewCrossSection(clicked_id);
        }, 800);
    }
}


function restartStressFormular(clicked_id, situation) {
    /*if (situation != 'armageddon') {
        let results = $('#results')[0];
        let internalForcesInputs = $('[class*=internalForces]');
        $('#sectionIconsTrigger')[0].classList.remove('collapsed');
        $('#usr_calculate')[0].setAttribute('disabled', '');
        $('#usr_calculate')[0].classList.add('disabledSubmit');
        $('#usr_calculate')[0].classList.remove('enableSubmit');
        $('[class*="card-img-top"]')[0].setAttribute('src', 'static/pictures/svg/usr_section_pic.svg');

        if ($('[for="name_value"]')[0] != undefined) {
            $('[for="name_value"]')[0].innerText = '';
        }

        // reset inputů zatížení
        for (i = 0; i < internalForcesInputs.length; i++) {
            internalForcesInputs[i].value = '';
            internalForcesInputs[i].setAttribute('disabled', '');
            internalForcesInputs[i].removeAttribute('placeholder');
            internalForcesInputs[i].parentElement.children[0].children[0].children[0].checked = false;
        }

        if (window.location.href.includes('stresses')) {
            // vynulování dat o zatížení a průřezu
            $('#stressing_forces')[0].value = 0;

            if ($('#name_part')[0]) {
                let sectionData = $('#name_part')[0];
                sectionData.parentElement.removeChild(sectionData);
            }

            // checkboxy s nastavením výpočtu
            $('#stress_forces')[0].checked = true;
            $('[name="stress_forces"]')[0].value = "yes";
            $('#von_mises')[0].checked = true;
            $('[name="von_mises"]')[0].value = "yes";
            $('#stress_axis')[0].checked = false;
            $('[name="stress_axis"]')[0].value = "no";
            $('#sigma_tau')[0].checked = true;
            $('[name="sigma_tau"]')[0].value = "yes";
        }

        if (clicked_id != 'stressedRestartButton') {
            results.parentElement.removeChild(results); // smazání výsledků - funkce volána z tlačítka "Nový průřez"
            $('#stressedEnviroment').collapse('toggle');
        }
    }*/

    let stressedPage = $('#stressedCrossSections')[0];
    stressedPage.innerHTML = `
        <div id="stressedEnviroment" class="section_field collapse show">
            <div class="card text-white bg-dark xs-10" id="usr">

                <div class="row justify-content-center align-items-center">
                    <!-- <div class="col-6 order-md-2">
                        <img src="static/pictures/svg/usr_section_pic.svg" class="card-img-top img-fluid" width="100%" id="main_form_pic">
                    </div> -->

                    <div class="col-12 col-md-7 order-md-1 mt-3">
                        <div class="form-row justify-content-center headerPart rounded" id="header_part">
                            <div class="form-row justify-content-center headerPart rounded" id="usr_headerPart">
                                <legend>Definice průřezu</legend>
                                <input type="hidden" name="section_info" value="usr" class="form-control">
                            </div>
                        </div>

                        <div class="row text-center mt-3 ml-2">
                            <div class="col-4">
                                <button type="button" id="sectionSave" class="btn btn-secondary" data-toggle="modal" data-target="#sectionManager" onclick="getSavedStressedSections();">Moje průřezy</button>
                            </div>
                            <div class="col-4">
                                <button type="button" id="sectionIconsTrigger" class="btn btn-secondary" data-toggle="collapse" data-target="#section_icons" onclick="refreshBigIcons();">Vytvoř průřez</button>
                            </div>
                            <div class="col-4">
                                <button type="button" id="stressedRestartButton" onclick="nextSection(this.id);" class="btn btn-secondary">Restart</button>
                            </div>
                        </div>

                        <!-- Section Cards -->
                        <div id="section_icons" class="section_field collapse">
                                <div class="container-fluid padding">
                                    <div class="row collapse show" name="content" id="section_content">

                                        <div class="col-6 col-md-4 col-lg-3 text-center">
                                            <div class="card-dark">
                                                <img class="card-img-top crossSectionIconBig" src="static/pictures/svg/IPE_section_pic.svg" id="IPE_bar_switch" data-toggle="modal" data-target="#sectionCreator" onclick="createNewCrossSection(this.id); editCreatorFormular();">
                                            </div>
                                        </div>

                                        <div class="col-6 col-md-4 col-lg-3 text-center">
                                            <div class="card-dark">
                                                <img class="card-img-top crossSectionIconBig" src="static/pictures/svg/HEB_section_pic.svg" id="HEB_bar_switch" data-toggle="modal" data-target="#sectionCreator" onclick="createNewCrossSection(this.id); editCreatorFormular();">
                                            </div>
                                        </div>

                                        <div class="col-6 col-md-4 col-lg-3 text-center">
                                            <div class="card-dark">
                                                <img class="card-img-top crossSectionIconBig" src="static/pictures/svg/UPE_section_pic.svg" id="UPE_bar_switch" data-toggle="modal" data-target="#sectionCreator" onclick="createNewCrossSection(this.id); editCreatorFormular();">
                                            </div>
                                        </div>

                                        <div class="col-6 col-md-4 col-lg-3 text-center">
                                            <div class="card-dark">
                                                <img class="card-img-top crossSectionIconBig" src="static/pictures/svg/L_section_pic.svg" id="L_s_bar_switch" data-toggle="modal" data-target="#sectionCreator" onclick="createNewCrossSection(this.id); editCreatorFormular();">
                                            </div>
                                        </div>

                                        <div class="col-6 col-md-4 col-lg-3 text-center">
                                            <div class="card-dark">
                                                <img class="card-img-top crossSectionIconBig" src="static/pictures/svg/T_section_pic.svg" id="T_s_bar_switch" data-toggle="modal" data-target="#sectionCreator" onclick="createNewCrossSection(this.id); editCreatorFormular();">
                                            </div>
                                        </div>

                                        <div class="col-6 col-md-4 col-lg-3 text-center">
                                            <div class="card-dark">
                                                <img class="card-img-top crossSectionIconBig" src="static/pictures/svg/RHS_section_pic.svg" id="RHS_bar_switch" data-toggle="modal" data-target="#sectionCreator" onclick="createNewCrossSection(this.id); editCreatorFormular();">
                                            </div>
                                        </div>

                                        <div class="col-6 col-md-4 col-lg-3 text-center">
                                            <div class="card-dark">
                                                <img class="card-img-top crossSectionIconBig" src="static/pictures/svg/CHS_section_pic.svg" id="CHS_bar_switch" data-toggle="modal" data-target="#sectionCreator" onclick="createNewCrossSection(this.id); editCreatorFormular();">
                                            </div>
                                        </div>

                                        <div class="col-6 col-md-4 col-lg-3 text-center">
                                            <div class="card-dark">
                                                <img class="card-img-top crossSectionIconBig" src="static/pictures/svg/crl_section_pic.svg" id="crl_bar_switch" data-toggle="modal" data-target="#sectionCreator" onclick="createNewCrossSection(this.id); editCreatorFormular();">
                                            </div>
                                        </div>

                                        <div class="col-6 col-md-4 col-lg-3 text-center">
                                            <div class="card-dark">
                                                <img class="card-img-top crossSectionIconBig" src="static/pictures/svg/rtg_section_pic.svg" id="rtg_bar_switch" data-toggle="modal" data-target="#sectionCreator" onclick="createNewCrossSection(this.id); editCreatorFormular();">
                                            </div>
                                        </div>

                                        <div class="col-6 col-md-4 col-lg-3 text-center">
                                            <div class="card-dark">
                                                <img class="card-img-top crossSectionIconBig" src="static/pictures/svg/cnv_section_pic.svg" id="cnv_bar_switch" data-toggle="modal" data-target="#sectionCreator" onclick="createNewCrossSection(this.id); editCreatorFormular();">
                                            </div>
                                        </div>

                                        <div class="col-6 col-md-4 col-lg-3 text-center">
                                            <div class="card-dark">
                                                <img class="card-img-top crossSectionIconBig" src="static/pictures/svg/mrg_section_pic.svg" id="mrg_bar_switch" data-toggle="modal" data-target="#sectionCreator" onclick="createNewCrossSection(this.id); editCreatorFormular();">
                                            </div>
                                        </div>
                                    </div>
                            </div>
                        </div>
                        <!-- Section Cards -->

                        <div class="form-row justify-content-center headerPart rounded m-3" id="header_part_forces">
                            <div class="form-row justify-content-center headerPart rounded" id="usr_headerPart_forces">
                                <legend>Vnitřní síly</legend>
                                <input type="hidden" name="forces_values" value="usr" class="form-control">
                            </div>
                        </div>

                        <!-- Internal forces checkboxes -->
                        <div class="row justify-content-center">
                            <div class="col-xs-6">
                                <!-- N -->
                                <div class="form-row justify-content-center align-items-center m-1">
                                    <div class="form-col-3 m-1">
                                        <label class="col-form-label">N:</label>
                                    </div>

                                    <div class="form-col-3 align-items-center m-1">
                                        <div class="input-group">
                                            <div class="input-group-prepend">
                                                <div class="input-group-text">
                                                    <input type="checkbox" id="Nxx_checkbox" onclick="defineInternalForces(this.id);">
                                                    <label for="Nxx_checkbox"></label>
                                                </div>
                                            </div>
                                            <input type="text" class="form-control internalForces" onchange="updateForcesData();" name="Nxx" disabled>
                                        </div>
                                    </div>
                                </div>

                                <!-- Vy -->
                                <div class="form-row justify-content-center align-items-center m-1">
                                    <div class="form-col-3 m-1">
                                        <label class="col-form-label">Vy:</label>
                                    </div>

                                    <div class="form-col-3 align-items-center m-1">
                                        <div class="input-group">
                                            <div class="input-group-prepend">
                                                <div class="input-group-text">
                                                    <input type="checkbox" id="Vyy_checkbox" onclick="defineInternalForces(this.id);">
                                                    <label for="Vyy_checkbox"></label>
                                                </div>
                                            </div>
                                            <input type="text" class="form-control internalForces" onchange="updateForcesData();" name="Vyy" disabled>
                                        </div>
                                    </div>
                                </div>

                                <!-- Vz -->
                                <div class="form-row justify-content-center align-items-center m-1">
                                    <div class="form-col-3 m-1">
                                        <label class="col-form-label">Vz:</label>
                                    </div>

                                    <div class="form-col-3 align-items-center m-1">
                                        <div class="input-group">
                                            <div class="input-group-prepend">
                                                <div class="input-group-text">
                                                    <input type="checkbox" id="Vzz_checkbox" onclick="defineInternalForces(this.id);">
                                                    <label for="Vzz_checkbox"></label>
                                                </div>
                                            </div>
                                            <input type="text" class="form-control internalForces" onchange="updateForcesData();" name="Vzz" disabled>
                                        </div>
                                    </div>
                                </div>

                                <!-- Mx -->
                                <div class="form-row justify-content-center align-items-center m-1">
                                    <div class="form-col-3 m-1">
                                        <label class="col-form-label">Mx:</label>
                                    </div>

                                    <div class="form-col-3 align-items-center m-1">
                                        <div class="input-group">
                                            <div class="input-group-prepend">
                                                <div class="input-group-text">
                                                    <input type="checkbox" id="Mxx_checkbox" onclick="defineInternalForces(this.id);">
                                                    <label for="Mxx_checkbox"></label>
                                                </div>
                                            </div>
                                            <input type="text" class="form-control internalForces" onchange="updateForcesData();" name="Mxx" disabled>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-xs-6">
                                <!-- My -->
                                <div class="form-row justify-content-center align-items-center m-1">
                                    <div class="form-col-3 m-1">
                                        <label class="col-form-label">My:</label>
                                    </div>

                                    <div class="form-col-3 align-items-center m-1">
                                        <div class="input-group">
                                            <div class="input-group-prepend">
                                                <div class="input-group-text">
                                                    <input type="checkbox" id="Myy_checkbox" onclick="defineInternalForces(this.id);">
                                                    <label for="Myy_checkbox"></label>
                                                </div>
                                            </div>
                                            <input type="text" class="form-control internalForces" onchange="updateForcesData();" name="Myy" disabled>
                                        </div>
                                    </div>
                                </div>

                                <!-- Mz -->
                                <div class="form-row justify-content-center align-items-center m-1">
                                    <div class="form-col-3 m-1">
                                        <label class="col-form-label">Mz:</label>
                                    </div>

                                    <div class="form-col-3 align-items-center m-1">
                                        <div class="input-group">
                                            <div class="input-group-prepend">
                                                <div class="input-group-text">
                                                    <input type="checkbox" id="Mzz_checkbox" onclick="defineInternalForces(this.id);">
                                                    <label for="Mzz_checkbox"></label>
                                                </div>
                                            </div>
                                            <input type="text" class="form-control internalForces" onchange="updateForcesData();" name="Mzz" disabled>
                                        </div>
                                    </div>
                                </div>

                                <!-- Mu -->
                                <div class="form-row justify-content-center align-items-center m-1">
                                    <div class="form-col-3 m-1">
                                        <label class="col-form-label">M1:</label>
                                    </div>

                                    <div class="form-col-3 align-items-center m-1">
                                        <div class="input-group">
                                            <div class="input-group-prepend">
                                                <div class="input-group-text">
                                                    <input type="checkbox" id="M11_checkbox" onclick="defineInternalForces(this.id);">
                                                    <label for="M11_checkbox"></label>
                                                </div>
                                            </div>
                                            <input type="text" class="form-control internalForces" onchange="updateForcesData();" name="M11" disabled>
                                        </div>
                                    </div>
                                </div>

                                <!-- Mv -->
                                <div class="form-row justify-content-center align-items-center m-1">
                                    <div class="form-col-3 m-1">
                                        <label class="col-form-label">M2:</label>
                                    </div>

                                    <div class="form-col-3 align-items-center m-1">
                                        <div class="input-group">
                                            <div class="input-group-prepend">
                                                <div class="input-group-text">
                                                    <input type="checkbox" id="M22_checkbox" onclick="defineInternalForces(this.id);">
                                                    <label for="M22_checkbox"></label>
                                                </div>
                                            </div>
                                            <input type="text" class="form-control internalForces" onchange="updateForcesData();" name="M22" disabled>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Internal forces checkboxes -->

                        <div class="row justify-content-center">
                            <form method="get" class="input_formular" id="usr_form" onsubmit="ajaxSubmit(event)">
                                <!-- Calculate options -->
                                <div class="form-row align-items-center m-2">
                                    <!-- Rozložit napětí na složky do os (napětí od My podle y a podle z, ...) -->
                                    <input type="checkbox" id="stress_axis" onclick="stressCalculateOption(this.id);">
                                    <label class="col-form-label ml-2" for="stress_axis">Rozložit dílčí napětí do souřadných os</label>
                                    <input type="hidden" name="stress_axis" class="form-control" value="no">
                                </div>

                                <div class="form-row align-items-center m-2">
                                    <!-- Rozdělit napětí na složky podle směrů vnitřních sil (Vy, Vz, My, ...)-->
                                    <input type="checkbox" id="stress_forces" onclick="stressCalculateOption(this.id);" checked>
                                    <label class="col-form-label ml-2" for="stress_forces">Dělit napětí do složek podle vnitřních sil</label>
                                    <input type="hidden" name="stress_forces" class="form-control" value="yes">
                                </div>

                                <div class="form-row align-items-center m-2">
                                    <!-- Celkové sigma, celkové tau -->
                                    <input type="checkbox" id="sigma_tau" onclick="stressCalculateOption(this.id);" checked>
                                    <label class="col-form-label ml-2" for="sigma_tau">Počítat i celková normálová a smyková napětí</label>
                                    <input type="hidden" name="sigma_tau" class="form-control" value="yes">
                                </div>

                                <div class="form-row align-items-center m-2">
                                    <!-- Počítat von Misesovo napětí -->
                                    <input type="checkbox" id="von_mises" onclick="stressCalculateOption(this.id);" checked>
                                    <label class="col-form-label ml-2" for="von_mises">Počítat i von Misesovo napětí</label>
                                    <input type="hidden" name="von_mises" class="form-control" value="yes">
                                </div>
                                <!-- Calculate options -->
                                <input type="submit" id="usr_calculate" value="Výpočet" class="btn-block rounded disabledSubmit" disabled onclick="activeBigIcons(this.id, &quot;&quot;)">
                            </form>
                        </div>
                    </div>
                </div>
            </div>


            <div class="modal fade" id="sectionManager" tabindex="-1" data-backdrop="static" data-keyboard="false" aria-labelledby="manager-label" aria-hidden="true">
                <div class="modal-dialog modal-dialog-scrollable modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header justify-content-center">
                            <h3 class="modal-title" id="manager-label">Moje uložené průřezy</h3>
                        </div>

                        <div class="modal-body">
                            <button type="button" class="btn btn-primary" disabled>Získávám průřezy...
                                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            </button>
                        </div>

                        <div class="modal-footer">
                            <div class="row justify-content-around">
                                <div class="col-5">
                                    <input type="button" id="selectSection" name="selectSection" value="Vybrat" onclick="chooseUserSections();" class="btn btn-secondary">
                                </div>

                                <div class="col-5">
                                    <input type="button" id="renameSection" name="renameSection" value="Přejmenovat" onclick="renameUserSections();" class="btn btn-secondary">
                                </div>

                                <div class="col-5">
                                    <input type="button" id="deleteSection" name="deleteSection" value="Smazat" onclick="deleteUserSections();" class="btn btn-secondary">
                                </div>

                                <div class="col-5">
                                    <input type="button" id="cancelSection" name="cancelSection" value="Zavřít" onclick="checkSubmitButton();" class="btn btn-secondary" data-dismiss="modal">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal fade" id="sectionCreator" tabindex="-1" data-backdrop="static" data-keyboard="false" aria-labelledby="creator-label" aria-hidden="true">
                <div class="modal-dialog modal-dialog-scrollable modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header justify-content-center">
                            <h3 class="modal-title" id="creator-label">Vytvoř nový průřez</h3>
                        </div>

                        <div class="modal-body">


                            <!-- Area for selected sections -->
                            <div id="crossSections" class="container-fluid padding align-items-start justify-content-flex-start">
                                <div id="selected_section_card" class="section_field collapse" style="display: none"></div>
                            </div>
                            <!-- Area for selected sections -->
                        </div>

                        <div class="modal-footer">
                            <div class="row justify-content-around">
                                <div class="col-5">
                                    <input type="button" id="selectCreatorSection" name="selectSection" value="Vybrat" onclick="confirmNewSection();" class="btn btn-secondary" disabled>
                                </div>

                                <div class="col-5">
                                    <input type="button" id="cancelCreatorSection" name="cancelSection" value="Zavřít" onclick="cancelCreator();" class="btn btn-secondary" data-dismiss="modal">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // $('#stressedEnviroment').collapse('toggle');
}


function propertiesCalculateOption(clicked_id) {
    let optionValueId = clicked_id.replace('checkbox', 'value');
    let optionValue = $(`#${optionValueId}`)[0];

    if ($(`#${clicked_id}`)[0].checked == true) {
        optionValue.setAttribute('value', 'yes');
    }

    else {
        optionValue.setAttribute('value', 'no');
    }
}


function freezeSectionIcons(icons, part) {
    for (i = 0; i < icons.length; i++) {
        if (icons[i].getAttribute('disabled') == 'true') {
            icons[i].removeAttribute('disabled');
        }

        else {
            icons[i].setAttribute('disabled', 'true');
        }
    }
}