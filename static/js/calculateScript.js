// Modul pro preprocessing a postprocessing a komunikaci se serverem během výpočtu.

// funkce vyvolaná kliknutím na submit formuláře
function ajaxSubmit(event) {
    event.preventDefault(); // zablokování defaultní submit funkce
    $('#section_content').collapse('toggle');

    if (event.target.id == 'mrg_calculate') {
        editFinalForm(event.target);
    }

    let form_data = $(`#${event.target.id}`).serialize(); // serializaci dat formuláře do json formátu;
    let progressStatus = '';
    let currentState = '';

    if (window.location.href.includes('stresses')) {

        if ($('#section_name')[0].value.substr(0, 5) == 'image') {
            form_data += `&dimension_type=usr&section_name=${$('#section_name')[0].value}&stressing_forces=${$('#stressing_forces')[0].value}`;
        }

        else {
            form_data += `&${$('#section_name')[0].value}&stressing_forces=${$('#stressing_forces')[0].value}`;
        }

    }

    else if (window.location.href.includes('frame')) {
        form_data = getStructureData().split('/').join("|");
    }

    if (window.location.href.includes('pythonanywhere')) {
        progressBarTimer();
    }

    $('#selected_section_card').collapse('toggle');

    if (window.location.href.includes('stresses')) {
        $('#stressedCrossSections')[0].innerHTML = '';
    }

    setTimeout(function() {
        createProgressBar(form_data);    // po odeslání dat na server se zneviditelní formulář průřezu a vytvoří progress bar

        let source = '';

        if (!window.location.href.includes('frame')) {
            source = new EventSource('/section_calculate_' + form_data);    // otevření kanálu SSE a předání dat pomocí GET přes URL adresu
        }

        else {
            source = new EventSource('/structure_calculate_' + form_data);
        }

        // funkce volaná pokaždé, když server pošle nová data
        source.onmessage = function(event) {
            currentState = event.data;
            /* Hodnota symbolizující aktuální stav výpočtu (0-100). V určitých fázích dojde
            ke změně popisu části výpočtu. Také nabíhá progress bar. */

            if (currentState > 100) {
                currentState = 100;
            }

            else if (isNaN(currentState)) {
                currentState = '';
            }

            if (!window.location.href.includes('pythonanywhere')) {
                // postupné zacheckávání checkboxů během progressu výpočtu
                let progressCheckboxes = $('[id$=_checkbox]');
                progressCheckboxes[0].checked = true;
                progressCheckboxes[1].checked = true;

                for (let i = 2; i < progressCheckboxes.length; i++) {
                    if (progressCheckboxes[i].checked == true) {
                        continue;
                    }

                    else {
                        progressCheckboxes[i].checked = true;
                        break;
                    }
                }

                let points = [15, 25, 60, 90]; // pro výpočet charakteristik

                if (window.location.href.includes('stresses')) {
                    points = [15, 25, 45, 65, 90];
                }

                let currentMaximum = parseInt($('#currentMaximum')[0].value);

                if (currentState == 0) {
                    currentState = 1;
                }

                if ((!isNaN(currentState)) && (currentMaximum != 100)) {
                    let j = 0;
                    while (currentMaximum != points[j]) {
                        j++;
                    }

                    if (!isNaN(points[j + 1])) {
                        $('#currentMaximum')[0].value = points[j + 1]
                    }

                    else {
                        $('#currentMaximum')[0].value = 100;
                    }
                }

                else {
                    $('#currentMaximum')[0].value = 100;
                }

                $('.progress-bar').css('width', currentState+'%').attr('aria-valuenow', 2 * currentState);  // grafický stav stavu výpočtu v progress baru
                $('.progress-bar-label').text(currentState);        // % číselný stav výpočtu v progress baru
            }

            progressStatus = analyseCurrentState(event.data, source);
        }
    }, 500);
}


function progressBarTimer() {
    let time = setInterval(timing, 100);
}

function timing() {
    if ($('.progress-bar-label')[0] != undefined) {
        let currentState = parseInt($('.progress-bar-label')[0].innerText.split('%')[0]);
        let currentMaximum = parseInt($('#currentMaximum')[0].value);

        if ((currentState < 100) || (!isNaN(currentState))) {
            $('.progress-bar-label')[0].innerText = String(currentState + 1) + "%";
            $('.progress-bar').css('width', currentState+'%').attr('aria-valuenow', 2 * currentState);
            console.log('Current state grows: ' + String(currentState + 1));
        }


        if (currentState + 1 > currentMaximum) {
            $('.progress-bar-label')[0].innerText = currentMaximum + "%";
            $('.progress-bar').css('width', currentMaximum+'%').attr('aria-valuenow', 2 * currentMaximum);
            console.log('Current maximum overtaken: ' + currentMaximum);
        }

        else if (isNaN(currentState)) {
            $('.progress-bar-label')[0].innerText = '';
            console.log('NaN');
        }

        else if (currentState > 100) {
            $('.progress-bar-label')[0].innerText = "100%";
            $('.progress-bar').css('width', currentState+'%').attr('aria-valuenow', 200);
            console.log('Done');
        }
    }

    else {
        return false;
    }
}


function analyseCurrentState(state, source) {
    if ((state.length > 15) && (!/non-positive|small|big|short|long|empty_input|open_cnv|NaN/.test(state))) {   // po výpočtu jsou místo stavu výpočtu poslány výsledky, místo čísla tedy server pošle dlouuhý json string
        // hotovo
        source.close();     // uzavření SSE kanálu
        currentState = '100';

        if ((!window.location.href.includes('pythonanywhere')) && (!window.location.href.includes('5000'))) {
            let progressCheckboxes = $('[id$=_checkbox]');

            let i = 0;
            while ((progressCheckboxes[i].checked == true) && (i < progressCheckboxes.length)) {
                i++;
            }

            progressCheckboxes[i].checked = true;
        }

        takeResults(state);
        return 'Hotovo';
    }

    else if (state == 'block_in_hole') {   // pokud je u merged průřezu špatně definována dutina, vrátí chybový status
        source.close();     // uzavření SSE kanálu
        mergedSectionFail();
        return 'Chyba v zadání!';
    }

    else if ((isNaN(state)) && (state != 'block_in_hole')) {   // při nekorektních inputech server vrátí nečíselný chybový status
        source.close();     // uzavření SSE kanálu
        serverValidationFail();
        return 'Chyba v zadání!';
    }

    else {
        return "Pokračujem";
    }
}


function serverValidationFail() {
    // smaže progress bar a vyprázdní div pro vybraný průřez
    let sectionDiv = $('#selected_section_card')[0];
    sectionDiv.innerHTML = '';
    let select = sectionDiv.parentElement;
    select.removeChild(select.lastChild);

    /* vytvoří alert s varováním o nekorektních vstupech */
    let alertDiv = createNewDiv(['alert', 'alert-dark', 'alert-dismissible', 'fade', 'show'], true, select)
    alertDiv.setAttribute('role', 'alert');
    alertDiv.setAttribute('id', 'validationAlert');

    let alertHeader = createNewTextElement('h4', 'Nesprávné zadání!', true, alertDiv);
    alertHeader.setAttribute('class', 'alert-heading');

    let alertContent = createNewTextElement('p', 'Minimálně jeden vstup byl zadán nesprávně nebo je vypnutá podpora Javascriptu. Zkuste vyplnit formulář znovu.', true, alertDiv);
    alertHeader.setAttribute('class', 'text-break');

    let closeButton = document.createElement('button');
    closeButton.setAttribute('type', 'button');
    closeButton.setAttribute('class', 'close');
    closeButton.setAttribute('data-dismiss', 'alert');
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.setAttribute('onclick', 'nextSection("nextSection");');
    alertDiv.appendChild(closeButton);

    let buttonSpan = createNewTextElement('span', '', true, closeButton);
    buttonSpan.setAttribute('aria-hidden', 'true');
    buttonSpan.innerHTML = '&times;'

    activeBigIcons('nextSection', $('#selected_section_card')[0]);
}


function mergedSectionFail() {
    // smaže progress bar a vyprázdní div pro vybraný průřez
    sectionDiv.innerHTML = '';
    select.removeChild(select.lastChild);

    /* vytvoří alert s varováním o nekorektních vstupech */
    let alertDiv = createNewDiv(['alert', 'alert-dark', 'alert-dismissible', 'fade', 'show'], true, select)
    alertDiv.setAttribute('role', 'alert');
    alertDiv.setAttribute('id', 'validationAlert');

    let alertHeader = createNewTextElement('h4', 'Nesprávné zadání!', true, alertDiv);
    alertHeader.setAttribute('class', 'alert-heading');

    let alertContent = createNewTextElement('p', 'Zdá se, že došlo k chybě při tvoření geometrie. Ve složeném průřezu se nachází dutina, která byla nesprávně definována, nebo se jednotlivé části překrývají. Pokud má průřez obsahovat dutinu, může pomoci definovat bod uvnitř ní ručně. Pokud průřez dutinu neobsahuje, byly nesprávně zadány rotace, zrcadlení nebo posuny průřezů.', true, alertDiv);
    alertHeader.setAttribute('class', 'text-break');

    let closeButton = document.createElement('button');
    closeButton.setAttribute('type', 'button');
    closeButton.setAttribute('class', 'close');
    closeButton.setAttribute('data-dismiss', 'alert');
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.setAttribute('onclick', 'nextSection("nextSection");');
    alertDiv.appendChild(closeButton);

    let buttonSpan = createNewTextElement('span', '', true, closeButton);
    buttonSpan.setAttribute('aria-hidden', 'true');
    buttonSpan.innerHTML = '&times;'
    source.close();

    activeBigIcons('nextSection', $('#selected_section_card')[0]);
}


// funkce skryje formulář průřezu a vytvoří progress bar (na stránce existuje pouze během běhu výpočtu)
function createProgressBar(form_data) {

    let progressBarDiv = document.createElement('div');     // vytvoření divu obsahujícího součásti progress baru
    progressBarDiv.id = 'progress_bar';
    progressBarDiv.setAttribute('class', 'text-center collapse mt-3');

    if(!window.location.href.includes('pythonanywhere')) {
        let progress = document.createElement('div');   // vytvoření divu obsahujícího samotný progress bar
        progress.classList.add('progress');
        progress.setAttribute('style', 'width: 100%;');

        let progressBarElement = document.createElement('div');     // přidání samotného progress baru, doplnění jeho vlastností
        // Přidá stylování progress baru. classList neumožňuje vkládat classy s mezerou, takže se celá class musí vložit natřikrát.
        progressBarElement.classList.add('progress-bar');
        progressBarElement.classList.add('progress-bar-striped');
        progressBarElement.classList.add('progress-bar-animated');
        progressBarElement.classList.add('active');
        progressBarElement.setAttribute('role', 'progresbar');
        progressBarElement.setAttribute('aria-valuenow', '0');
        progressBarElement.setAttribute('aria-valuemin', '0');
        progressBarElement.setAttribute('aria-valuemax', '200');
        progressBarElement.setAttribute('style', 'width: 0%');

        progress.appendChild(progressBarElement);    // přidání divu s progress barem do jeho divu

        progressBarDiv.appendChild(progress);   // přidání divu s progress barem do hlavního divu (se součástmi progressu)

        let progressSpanRow = createNewDiv(['row', 'justify-content-center', 'm-2'], true, progressBarDiv);
        let progressBarElementSpan = createNewTextElement('span', '', true, progressSpanRow);    // přidání spanu pro % progress v progress baru
        progressBarElementSpan.classList.add('progress-bar-label');
        progressBarElementSpan.setAttribute('style', 'display: none');

        createProgressChecklist(progressBarDiv, form_data);  // přidání divu s checklistem korků výpočtu do hlavního divu (se součástmi progressu)
    }

    else {
        let spinnerDiv = createNewDiv(['row', 'justify-content-center', 'my-3'], true, progressBarDiv);
        let spinnerElement = createNewDiv(['spinner-border', 'text-primary'], true, spinnerDiv);
        spinnerElement.setAttribute('style', 'width: 3rem; height: 3rem;');
        spinnerElement.setAttribute('role', 'status');
        let spinnerTextDiv = createNewDiv(['row', 'justify-content-center', 'mx-3'], true, progressBarDiv);
        let progressText = createNewTextElement('h4', 'Probíhá analýza. Složitější zadání a jemnější síť prodlužují potřebnou dobu až na pár minut.', true, spinnerTextDiv);
    }

    if (window.location.href.includes('stresses')) {
        $('#stressedCrossSections')[0].appendChild(progressBarDiv);    // přidání hlavního divu na stránku za div průřezů;
        $('#stressedEnviroment').collapse('toggle');
    }

    else {
        $('#crossSections')[0].appendChild(progressBarDiv);    // přidání hlavního divu na stránku za div průřezů;
    }

    $('#progress_bar').collapse('toggle');
}


function createProgressChecklist(progressBarDiv, form_data) {
    let todoParts = {'inputs': 'Zpracování vstupů', 'shape': 'Vytvoření geometrie', 'mesh': 'Vytvoření sítě',
    'geometric': 'Geometrické charakteristiky', 'warping': 'Torzní a deplanační charakteristiky',
    'plastic': 'Plastické charakteristiky', 'results': 'Zpracování výsledků'};

    let calculateOptions = {};

    if (!window.location.href.includes('stresses')) {
        for (let n = 0; n < form_data.split('&').length - 1; n++) {
            if (/geometric|warping|plastic/.test(form_data.split('&')[n])) {
                calculateOptions[form_data.split('&')[n].split('=')[0].replace('_value', '')] = form_data.split('&')[n].split('=')[1];
            }
        }

        for (option of Object.keys(calculateOptions)) {
            if (calculateOptions[option] == 'no') {
                delete todoParts[option];
            }
        }
    }

    else {
        todoParts = {'inputs': 'Zpracování vstupů', 'shape': 'Vytvoření geometrie', 'mesh': 'Vytvoření sítě',
        'geometric': 'Geometrické charakteristiky', 'warping': 'Torzní a deplanační charakteristiky',
        'plastic': 'Plastické charakteristiky', 'properties': 'Průřezové charakteristiky',
        'stresses': 'Analýza napětí', 'results': 'Zpracování výsledků'};
    }

    for (let mark of Object.keys(todoParts)) {
        let checklistRow = createNewDiv(['row', 'align-items-left', 'm-2'], true, progressBarDiv);
        let checkboxColumn = createNewDiv(['col-1', 'offset-1'], true, checklistRow);
        let calculatePartColumn = createNewDiv(['col-9', 'justify-content-start'], true, checklistRow);

        createNewCheckbox(`${mark}_checkbox`, '', '', true, calculatePartColumn);
        let checkboxLabel = createNewTextElement("label", todoParts[mark], true, calculatePartColumn);
        checkboxLabel.setAttribute('for', `${mark}_checkbox`);
        checkboxLabel.setAttribute('class', 'col-form-label');
    }

    let initialMaximum = 15; // pro charakteristiky i pro napětí
    createNewInput('hidden', 'currentMaximum', '', '', '', '', '', initialMaximum, '', true, progressBarDiv);


    setTimeout(function() {
        progress_bar.children[progress_bar.children.length - 3].scrollIntoView();
    }, 500);
}


// Funkce volaná při doplnění výsledků do json_result inputu. Po převzetí jeho hodnoty smaže progress bar a formulář průřezu.
function takeResults(string) {
    let resultValues = JSON.parse(string);
    $('#progress_bar').collapse('toggle');

    setTimeout(function() {
        // pokud neexistuje div "results", vytvoří ho
        if (!$('#results')[0]) {
            $('<div id="results" class="collapse">\n</div>').insertAfter('#progress_bar');
            refreshTemplate(resultValues);
        }

        /* Hned po vytvoření divu s výsledkama smaže progress bar a obsah průřezového divu: formulář průřezu, json input
        a elementy speciálních průřezů (canvas a merged), které nejsou uvnitř jejich formulářů. Pro nový výpočet je nutné
        znovu zvolit průřez. */
        $('#progress_bar')[0].remove();

        if (!window.location.href.includes('stresses')) {
            while ($('#selected_section_card')[0].firstChild) {
                $('#selected_section_card')[0].removeChild($('#selected_section_card')[0].lastChild);
            }
        }
    }, 800);
}


// funkce doplní obsah divu výsledků o tabulku s hodnotami z listu výsledků
function refreshTemplate(resultValues) {
    // přejmenuje "L_s" na vhodnější název průřezu pro zobrazení
    if (resultValues['dim_type'] == 'mrg') {
        resultValues['dim_type'] = 'Složený průřez';
    }

    // přejmenuje "L_s" na vhodnější název průřezu pro zobrazení
    if (resultValues['dim_type'] == 'cnv') {
        resultValues['dim_type'] = 'Uživatelský průřez';
    }

    // přejmenuje "L_s" na vhodnější název průřezu pro zobrazení
    if (resultValues['dim_type'] == 'L_s') {
        resultValues['dim_type'] = 'Úhelník';
    }

    // přejmenuje "T_s" na vhodnější název průřezu pro zobrazení
    if (resultValues['dim_type'] == 'T_s') {
        resultValues['dim_type'] = 'T-profil';
    }

    // přejmenuje "crl" na vhodnější název průřezu pro zobrazení
    if (resultValues['dim_type'] == 'crl') {
        resultValues['dim_type'] = 'Kulatina';
    }

    // přejmenuje "rtg" na vhodnější název průřezu pro zobrazení
    if (resultValues['dim_type'] == 'rtg') {
        resultValues['dim_type'] = 'Plech';
    }

    if (!window.location.href.includes('stresses')) {
        resultsOfProperties(resultValues);
    }

    else {
        resultsOfStresses(resultValues);
    }

    // zatím neumí počítat torzní modul průřezu a obvod u canvas a merged průřezů
    if ((resultValues['dim_type'] == 'Složený průřez') || (resultValues['dim_type'] == 'Uživatelský průřez')) {
        resultValues['perimeter'] = '???';    // obvod
        resultValues['tors_modulus'] = '???';   // torzní průřezový modul
        // dimension = '???';
    }

    $('#results').collapse('toggle');
}


function resultsOfProperties(resultValues) {
    let labelsOfMarkers = ['Elastické charakteristiky k těžištním osám', 'Elastické charakteristiky k hlavním osám',
        'Plastické charakteristiky', 'Torzní a výsečové charakteristiky', 'Obrázek průřezu s hlavními body a sítí']
    let refObject = ['elasticCgAxisTable', 'elasticMainAxisTable', 'plasticTable', 'torsionalAndWarpingTable', 'section_picture']

    createCollapsingSections(labelsOfMarkers, refObject, resultValues, 'properties');

    // elastické charakteristiky k těžištním osám
    if (resultValues['geometric'] == 'yes') {
        $('#elasticCgAxisTable')[0].innerHTML = `
            <tbody>
                <tr>
                    <td>Plocha průřezu A</td>
                    <td>${resultValues['area']}</td>
                    <td>[m<sup>2</sup>]</td>
                </tr>
                <tr>
                    <td>Tíha průřezu G</td>
                    <td>${resultValues['self_weight']}</td>
                    <td>[kg/m]</td>
                </tr>
                <tr>
                    <td>Obvod průřezu U</td>
                    <td>${resultValues['perimeter']}</td>
                    <td>[m]</td>
                </tr>
                <tr>
                    <td>Poloha těžiště v ose z<sub>Cg</sub></td>
                    <td>${resultValues['zcgh']}</td>
                    <td>[mm]</td>
                </tr>
                <tr>
                    <td>Poloha těžiště v ose y<sub>Cg</sub></td>
                    <td>${resultValues['ycgl']}</td>
                    <td>[mm]</td>
                </tr>
                <tr>
                    <td>Mom. setrv. I<sub>y</sub></td>
                    <td>${resultValues['in_mom_y']}</td>
                    <td>[m<sup>4</sup>]</td>
                </tr>
                <tr>
                    <td>Mom. setrv. I<sub>z</sub></td>
                    <td>${resultValues['in_mom_z']}</td>
                    <td>[m<sup>2</sup>]</td>
                </tr>
                <tr>
                    <td>Elast. průř. modul W<sub>el,y</sub></td>
                    <td>${resultValues['wely']}</td>
                    <td>[m<sup>3</sup>]</td>
                </tr>
                <tr>
                    <td>Elast. průř. modul W<sub>el,z</sub></td>
                    <td>${resultValues['welz']}</td>
                    <td>[m<sup>3</sup>]</td>
                </tr>
                <tr>
                    <td>Elast. průř. modul W<sub>el,u</sub></td>
                    <td>${resultValues['welu']}</td>
                    <td>[m<sup>3</sup>]</td>
                </tr>
                <tr>
                    <td>Elast. průř. modul W<sub>el,v</sub></td>
                    <td>${resultValues['welv']}</td>
                    <td>[m<sup>3</sup>]</td>
                </tr>
                <tr>
                    <td>Poloměr setrvačnosti i<sub>y</sub></td>
                    <td>${resultValues['in_rad_y']}</td>
                    <td>[mm]</td>
                </tr>
                <tr>
                    <td>Poloměr setrvačnosti i<sub>z</sub></td>
                    <td>${resultValues['in_rad_z']}</td>
                    <td>[mm]</td>
                </tr>
            </tbody>
        `;
    }

    else {
        $('#elasticCgAxisTable_div')[0].parentElement.innerHTML = '';
    }


    // elastické charakteristiky k hlavním osám
    if (resultValues['geometric'] == 'yes') {
        $('#elasticMainAxisTable')[0].innerHTML = `
            <tbody>
                <tr>
                    <td>Hlavní mom. setrv. I<sub>u</sub></td>
                    <td>${resultValues['in_mom_u']}</td>
                    <td>[m<sup>4</sup>]</td>
                </tr>
                <tr>
                    <td>Hlavní mom. setrv. I<sub>v</sub></td>
                    <td>${resultValues['in_mom_v']}</td>
                    <td>[m<sup>4</sup>]</td>
                </tr>
                <tr>
                    <td>Elast. průř. modul W<sub>el,u</sub></td>
                    <td>${resultValues['welu']}</td>
                    <td>[m<sup>3</sup>]</td>
                </tr>
                <tr>
                    <td>Elast. průř. modul W<sub>el,v</sub></td>
                    <td>${resultValues['welv']}</td>
                    <td>[m<sup>3</sup>]</td>
                </tr>
                <tr>
                    <td>Deviační moment D<sub>yz</sub></td>
                    <td>${resultValues['dev_mom_yz']}</td>
                    <td>[m<sup>4</sup>]</td>
                </tr>
                <tr>
                    <td>Natočení hl. os α</td>
                    <td>${resultValues['alfa_deg']}</td>
                    <td>[°]</td>
                </tr>
                <tr>
                    <td>Poloměr setrvačnosti i<sub>u</sub></td>
                    <td>${resultValues['in_rad_u']}</td>
                    <td>[mm]</td>
                </tr>
                <tr>
                    <td>Poloměr setrvačnosti i<sub>v</sub></td>
                    <td>${resultValues['in_rad_v']}</td>
                    <td>[mm]</td>
                </tr>
            </tbody>
        `;
    }

    else {
        $('#elasticMainAxisTable_div')[0].parentElement.innerHTML = '';
    }

    // plastické charakteristiky
    if (resultValues['plastic'] == 'yes') {
        $('#plasticTable')[0].innerHTML = `
            <tbody>
                <tr>
                    <td>Plast. smyková plocha A<sub>vy,pl</sub></td>
                    <td>${resultValues['avy']}</td>
                    <td>[m<sup>2</sup>]</td>
                </tr>
                <tr>
                    <td>Plast. smyková plocha A<sub>vz,pl</sub></td>
                    <td>${resultValues['avz']}</td>
                    <td>[m<sup>2</sup>]</td>
                </tr>
                <tr>
                    <td>Plast. smyková plocha A<sub>vu,pl</sub></td>
                    <td>${resultValues['avu']}</td>
                    <td>[m<sup>2</sup>]</td>
                </tr>
                <tr>
                    <td>Plast. smyková plocha A<sub>vv,pl</sub></td>
                    <td>${resultValues['avv']}</td>
                    <td>[m<sup>2</sup>]</td>
                </tr>
                <tr>
                    <td>Plast. průř. modul W<sub>pl,y</sub></td>
                    <td>${resultValues['wply']}</td>
                    <td>[m<sup>3</sup>]</td>
                </tr>
                <tr>
                    <td>Plast. průř. modul W<sub>pl,z</sub></td>
                    <td>${resultValues['wplz']}</td>
                    <td>[m<sup>3</sup>]</td>
                </tr>
                <tr>
                    <td>Plast. průř. modul W<sub>pl,u</sub></td>
                    <td>${resultValues['wplu']}</td>
                    <td>[m<sup>3</sup>]</td>
                </tr>
                <tr>
                    <td>Plast. průř. modul W<sub>pl,v</sub></td>
                    <td>${resultValues['wplv']}</td>
                    <td>[m<sup>3</sup>]</td>
                </tr>
            </tbody>
        `;
    }

    else {
        $('#plasticTable_div')[0].parentElement.innerHTML = '';
    }

    // torzní a výsečové charakteristiky
    if (resultValues['warping'] == 'yes') {
        $('#torsionalAndWarpingTable')[0].innerHTML = `
            <tbody>
                <tr>
                    <td>Polární mom. setrv. I<sub>p</sub></td>
                    <td>${resultValues['polar_mom']}</td>
                    <td>[m<sup>4</sup>]</td>
                </tr>
                <tr>
                    <td>Torzní mom. setrv. I<sub>t</sub></td>
                    <td>${resultValues['tors_mom']}</td>
                    <td>[m<sup>4</sup>]</td>
                </tr>
                <tr>
                    <td>Torzní modul průřezu W<sub>t</sub></td>
                    <td>${resultValues['tors_modulus']}</td>
                    <td>[m<sup>3</sup>]</td>
                </tr>
                <tr>
                    <td>Poloměr setrvačnosti i<sub>p</sub></td>
                    <td>${resultValues['in_rad_p']}</td>
                    <td>[mm]</td>
                </tr>
                <tr>
                    <td>Výsečový mom. setrv. I<sub>ω</sub></td>
                    <td>${resultValues['in_mom_w']}</td>
                    <td>[m<sup>6</sup>]</td>
                </tr>
                <tr>
                    <td>Poloha středu smyku y<sub>Cs</sub></td>
                    <td>${resultValues['shear_center_y']}</td>
                    <td>[mm]</td>
                </tr>
                <tr>
                    <td>Poloha středu smyku z<sub>Cs</sub></td>
                    <td>${resultValues['shear_center_z']}</td>
                    <td>[mm]</td>
                </tr>
            </tbody>
        `;
    }

    else {
        $('#torsionalAndWarpingTable_div')[0].parentElement.innerHTML = '';
    }

    // obrázek průřezu
    let pictureRow = results.lastChild.lastChild;
    let image = document.createElement('img');
    image.setAttribute('src', `${resultValues['img_src']}`);
    pictureRow.append(image);

    // tlačítka pro ukládání
    let buttonRow = createNewDiv(['row', 'justify-content-center'], true, results);

    for (k = 0; k < resultValues['buttons'].length; k++) {
        let buttonColumn = createNewDiv(['col-10', 'col-md-3', 'm-2'], true, buttonRow);
        buttonColumn.innerHTML += resultValues['buttons'][k];
    }
}


function resultsOfStresses(resultValues) {
    let labelsOfMarkers = [];
    let refObject = [];
    let stressingForces = $('#stressing_forces')[0].value.split('|');
    let loadings = [];

    for (const [key, value] of Object.entries(resultValues)) {
        if (!/buttons|dim|name/.test(key)) {
            labelsOfMarkers.push(String(key));
            refObject.push(String(value));
        }
    }

    for (load of stressingForces) {
        loadings[load.split(":")[0]] = load.split(":")[1];
    }

    createCollapsingSections(labelsOfMarkers, refObject, resultValues, 'stress');

    // tlačítka pro ukládání
    let buttonRow = createNewDiv(['row', 'justify-content-center'], true, results);

    for (k = 0; k < resultValues['buttons'].length; k++) {
        let buttonColumn = createNewDiv(['col-10', 'col-md-3', 'm-2'], true, buttonRow);
        buttonColumn.innerHTML += resultValues['buttons'][k];
    }
}


function createCollapsingSections(labelsOfMarkers, refObject, resultValues, analysis) {
    let results = $('#results')[0];
    results.setAttribute('class', 'justify-content-center');
    let dimension = `Dimenze průřezu: ${resultValues['dim_val']}`;

    let resultHeader = createNewDiv(['cross_section_type', 'text-center', 'm-2'], true, results);
    createNewTextElement('h4', `Průřez: ${resultValues['dim_type']}`, true, resultHeader);
    createNewTextElement('h4', `${dimension}`, true, resultHeader);

    for (j = 0; j < labelsOfMarkers.length; j++) {
        let idOfElement = refObject[j] + '_div';

        if (analysis == 'stress') {
            let k = 0;

            while (isNaN(refObject[j][k])) {
                k++;
            }
            // najde index, na kterém začíná číselné označení v názvu souboru obrázku

            while (!isNaN(refObject[j][k])) {
                k++;
            }
            // najde index, kde už není číselné označení v názvu souboru obrázku

            k += 7; // nyní je k index, na kterém začíná identifikárot napětí v souboru obrázku

            let partOfImageSource = refObject[j].replace('_section.svg', '')    // odstraní konec názvu
            let newRefNameLength = partOfImageSource.length;

            // z refObject, který obsahuje img src, se získal identifikátor napětí a pod tímto se uloží ID divu
            idOfElement = refObject[j].substr(k, newRefNameLength - k) + '_div';
        }

        let tableRow = createNewDiv(['row', 'justify-content-center'], true, results);
        let button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.setAttribute('class', 'btn btn-secondary btn-block rounded my-2');
        button.setAttribute('data-toggle', 'collapse');
        button.setAttribute('data-target', `#${idOfElement}`);
        button.innerHTML = labelsOfMarkers[j];
        tableRow.append(button);

        if ((analysis == 'stress') && (labelsOfMarkers[j] != 'Zatížení')) {
            let tableDiv = createNewDiv(['section_properties', 'collapse'], true, tableRow);
            tableDiv.setAttribute('id', `${idOfElement}`);

            // obrázek průřezu
            let pictureRow = results.lastChild.lastChild;
            let image = document.createElement('img');
            image.setAttribute('src', `${refObject[j]}`);
            pictureRow.append(image);
        }

        else {
            if (j != labelsOfMarkers.length - 1) {
                let tableDiv = createNewDiv(['section_properties', 'table-responsive-xm', 'collapse'], true, tableRow);
                tableDiv.setAttribute('id', `${idOfElement}`);
                let table = document.createElement('table');
                table.setAttribute('class', 'table-dark table-bordered table-hover table-sm');
                tableDiv.append(table);
                table.setAttribute('id', refObject[j]);
            }

            else {
                let tableDiv = createNewDiv(['section_properties', 'collapse'], true, tableRow);
                tableDiv.setAttribute('id', `${idOfElement}`);
            }
        }
    }
}