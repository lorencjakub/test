// Skript pro přidávání elementů a správu proměnných elementů průřezu (welded a rolled průřezy mají různé elementy).

function createNewDiv(classList, append, parentElement) {
    /*
    listOfClass = seznam tříd, které je divu potřeba přidat
    append = pokud je true, vloží se nový element jako poslední potomek zvoleného parentElementu
    parentElement = zvolený rodič nového elementu (nemá smysl jej zadávat, pokud append = false)
    */

    let element = document.createElement('div');

    for (i = 0; i < classList.length; i++) {
        element.classList.add(classList[i]);
    }

    if (append === true) {
        // vložení elementů do formuláře, pokud je parametr true (při false nedojde k vložení nikam)
        parentElement.appendChild(element);
    }

    return element;
}

function createNewInput(type, id, name, maxlength, minlength, min, max, value, thisClass, append, parentElement) {

    /*
    type = typ input elementu (checkbox, text, hidden,...)
    id = zvolené ID pro nový element
    name = zvolené name pro nový element
    maxlength, minlength = omezení počtu znaků, které je možné do inputu zadat
    min, max = omezení hodnoty, kteoru lze do inputu zadat
    value = hodnota (u button inputu znamená jeho popis)
    thisClass = zvolená class nového elementu
    append = pokud je true, vloží se nový element jako poslední potomek zvoleného parentElementu
    parentElement = zvolený rodič nového elementu (nemá smysl jej zadávat, pokud append = false)
    */

    let element = document.createElement('input');

    let attributes = [type, id, name, maxlength, minlength, min, max, value, thisClass];
    let keys = ['type', 'id', 'name', 'maxlength', 'minlength', 'min', 'max', 'value', 'class'];

    // přidá do elementu žádané (neprázdné) atributy
    for (i = 0; i < attributes.length; i++) {
        if (attributes[i] != '') {
            element.setAttribute(keys[i], attributes[i]);
        }

        else {
            continue;
        }
    }

    if (append === true) {
        // vložení elementů do formuláře, pokud je parametr true (při false nedojde k vložení nikam)
        parentElement.appendChild(element);
    }

    return element;
}

// vytvoří nový textový element a přidá mu jeho obsah
function createNewTextElement(type, content, append, parentElement) {
// přidá k textovemu elementu text

    /*
    type = typ textového elementu (label, p, h,...)
    content = textový string, který má výt elementu přiřazen
    append = pokud je true, vloží se nový element jako poslední potomek zvoleného parentElementu
    parentElement = zvolený rodič nového elementu (nemá smysl jej zadávat, pokud append = false)
    */

    let textElement = document.createElement(type);
    let elementString = document.createTextNode(content);
    textElement.appendChild(elementString);

    if (append === true) {
        // vložení elementů do formuláře, pokud je parametr true (při false nedojde k vložení nikam)
        parentElement.appendChild(textElement);
    }

    return textElement;
}

// přidá nový element typu checkbox
function createNewCheckbox(id, name, action, append, parentElement) {

    /*
    id = zvolené ID pro nový element
    name = zvolené name pro nový element
    action = string, obsahuje událost, která má být na checkboxu volána při eventu onclick
    append = pokud je true, vloží se nový element jako poslední potomek zvoleného parentElementu
    parentElement = zvolený rodič nového elementu (nemá smysl jej zadávat, pokud append = false)
    */

    let type = 'checkbox';
    let element = document.createElement('input');

    let attributes = [type, id, name];
    let keys = ['type', 'id', 'name'];

    // přidá do elementu žádané (neprázdné) atributy
    for (i = 0; i < attributes.length; i++) {
        if (attributes[i] != '') {
            element.setAttribute(keys[i], attributes[i]);
        }

        else {
            continue;
        }
    }

    element.setAttribute('onclick', action);

    if (append === true) {
        // vložení elementů do formuláře, pokud je parametr true (při false nedojde k vložení nikam)
        parentElement.appendChild(element);
    }

    return element;
}

// přidá nový element typu button
function createNewButton(id, name, action, value, append, parentElement) {

    /*
    id = zvolené ID pro nový element
    name = zvolené name pro nový element
    action = string, obsahuje událost, která má být na checkboxu volána při eventu onclick
    value = popis buttonu
    append = pokud je true, vloží se nový element jako poslední potomek zvoleného parentElementu
    parentElement = zvolený rodič nového elementu (nemá smysl jej zadávat, pokud append = false)
    */

    let type = 'button';
    let element = document.createElement('input');

    let attributes = [type, id, name];
    let keys = ['type', 'id', 'name'];

    // přidá do elementu žádané (neprázdné) atributy
    for (i = 0; i < attributes.length; i++) {
        if (attributes[i] != '') {
            element.setAttribute(keys[i], attributes[i]);
        }

        else {
            continue;
        }
    }

    element.value = value;
    element.setAttribute('onclick', action);

    if (append === true) {
        // vložení elementů do formuláře, pokud je parametr true (při false nedojde k vložení nikam)
        parentElement.appendChild(element);
    }

    return element;
}

/* Funkce na vytvoření obsahu formuláře průřezu pro rolled nebo welded průřez. Po kliknutí na welded/rolled checkbox
předá serveru typ průřezu, server vrátí seznam dimenzí pro select, yytvořený z databáze průřezů. Volá se i při změně
checkboxu na vytvořeném formuláři. */
function createSelectValues(clicked_id, checkbox, clearIt) {
    let objectId = clicked_id.substr(0, 3);
    let part = '';

    if (objectId != 'cus') {    // pokud není funkce volána z custom switcheru
        if ((clicked_id.substr(-3, 3) == 'fir') || (clicked_id.substr(-3, 3) == 'sec')) {
            part = clicked_id.substr(-4, 4);
        }

        if ((objectId == 'fir') || (objectId == 'sec')) {
            part = '_' + objectId;
            objectId = clicked_id.substr(-3, 3);
        }
    }

    else {
        objectId = clicked_id.substr(7, 3);

        if ((clicked_id.substr(-3, 3) == 'fir') || (clicked_id.substr(-3, 3) == 'sec')) {
            part = '_' + clicked_id.substr(-3, 3);
        }

        else {
            part = '';
        }
    }

    let formCheckbox = '';
    let weldedValue = $(`#welding_part${part}`)[0];

    if (checkbox == '') {
        formCheckbox = $(`#custom_${objectId}_welded_check${part}`)[0]  // welded/checked checkbox již vloženého formuláře, volá se z kliknutí na checkbox
    }

    else {
        formCheckbox = checkbox;    // welded/checked checkbox vytvářeného formuláře, volá se při inicializaci formuláře
    }

    if (clearIt === true) {
        // funkce na promazání všech dynamických elementů předtím, než se začnou tvořit odpovídající nové
        deleteWrongInputs(objectId, part);
    }

    else if (clearIt == 'select') {
        // je volána checkboxem pro rovnostranné/nerovnostranné průřezy, vymaže pouze select s dimenzemi
        $(`#dimension_val_option${part}`)[0].parentNode.innerHTML = '';
    }

    // válcovaný průřez
    if (formCheckbox.checked == false) {
        weldedValue.value = 'no';
        let source = new EventSource('/rolled_values_' + objectId);
        source.onmessage = function(event) {
            let valuesString = event.data;
            let values = valuesString.split(', ');
            source.close();
            let equalValue = $(`#equalValue${part}`)[0];
            equalValue.value = 'equal';     // při změně z welded na rolled průřez se equalValue vždy musí nastavit na defaultní odnotu "equal"
            inputsOfCrossSection(values, clicked_id, objectId, part, equalValue);
        }
    }

    // svařovaný průřez
    else {
        weldedValue.value = 'yes';
        let source = new EventSource('/welded_values_' + objectId);
        source.onmessage = function(event) {
            let valuesString = event.data;
            let values = valuesString.split(', ');
            source.close();
            let equalValue = $(`#equalValue${part}`)[0];
            inputsOfCrossSection(values, clicked_id, objectId, part, equalValue);

            if (this.objectId == 'crl') {
                $('#equalValue')[0].innerHTML = $('#equalValue')[0].children[0].children[0].innerHTML;
            }
        }
    }
}

/* Funkce volaná na průřezu po zjištění dimenzí (pro rolled průřez) nebo inputů (pro welded průřez). Ty se vloží
do formuláře před popisek mesh inputu. */
function inputsOfCrossSection(values, clicked_id, objectId, part, equalValue) {
    let newElements = '';
    let sectionForm = $(`#values_part${part}`)[0];   // div hodnot welded průřezu

    if (((objectId == 'L_s') || (objectId == 'RHS')) && ($('[for*="welded_check"]')[0].getAttribute('class').includes('active'))) {
        sectionForm.classList.remove('m-2');
    }

    else {
        sectionForm.classList.add('m-2');
    }

    if ($(`#custom_${objectId}_equal_check${part}`)[0]) {  // aktivuje switcher, změní jej graficky a equalValue na příslušnou hodnotu
        activeSectionEqual(part, clicked_id, objectId);
    }

    // pokud je values tvořen čísly, jedná se o válcovaný průřez  a vytvoří se mu select
    if (parseInt(values[0])) {
        // vrací list elementů, které se přidají do stávajícího formuláře
        newElements = rolledSectionPart(values, clicked_id, objectId, part);

        // vloží získané elementy do formuláře (vytvoří řádek, v něm sloupec pro label a pro input a vloží je do nich)
        let colSelectRow = createNewDiv(['col-12'], false, '');
        let selectRow = createNewDiv(['form-row', 'justify-content-left', 'align-items-center', 'm-2'], true, colSelectRow);
        let labelsColumn = createNewDiv(['col-6'], true, selectRow);
        let inputsColumn = createNewDiv(['col-6'], true, selectRow);

        newElements[0].classList.add('col-form-label');
        newElements[1].classList.add('form-control');
        newElements[1].setAttribute('onchange', 'editFinalForm(this.id);');
        newElements[1].setAttribute('width', '30px');
        newElements[1].classList.add('rounded');

        if (!$(`#custom_${objectId}_equal_check${part}`)[0]) {
            labelsColumn.appendChild(newElements[0]);
            inputsColumn.appendChild(newElements[1]);

            // pokud je průřez RHS nebo L (tzn. newElements má víc než 3 položky), vloží se div se switcherem před div se selectem
            if (newElements.length > 2) {
                sectionForm.appendChild(newElements[2]);
                sectionForm.appendChild(colSelectRow);
            }

            else {
                sectionForm.appendChild(labelsColumn);
                sectionForm.appendChild(inputsColumn);
            }
        }

        else {
            sectionForm.children[2].children[0].children[1].appendChild(newElements[1]); // vloží pouze aktualizovaný select, do input colum
        }
    }

    // pokud je values tvořen nečíselným stringem, jedná se o svařovaný průřez  a vytvoří se mu inputy
    else {
        // vrací list elementů, které se přidají do stávajícího formuláře
        newElements = weldedSectionPart(values, objectId, part);
        let groupOfValues = createNewDiv(['form-group', 'col-12'], true, sectionForm);

        // vloží získané elementy do formuláře
        for (k = 0; k < newElements.length; k += 2) {
            // vytvoří nový řádek se sloupci pro label a input (tudíž dvě buňky)
            let selectRow = createNewDiv(['form-row', 'justify-content-start', 'align-items-center', 'my-2'], false, '');
            let labelsColumn = createNewDiv(['col-6'], true, selectRow);
            let inputsColumn = createNewDiv(['col-6'], true, selectRow);

            labelsColumn.appendChild(newElements[k]);
            inputsColumn.appendChild(newElements[k + 1]);

            // přidání span elementu k FE inputu
            let elementSpan = createNewTextElement('span', '', false, '');
            elementSpan.setAttribute('id', newElements[k + 1].id + part + '_check_valid');
            inputsColumn.appendChild(elementSpan);

            groupOfValues.appendChild(selectRow);
        }
    }

    if (part != '') {
        editFinalForm(clicked_id)   // zavolá editaci formuláře svařovaného průřezu až po vytvoření selectů
    }

    if ((clicked_id.includes('custom')) && (clicked_id.includes('equal_check'))) {
        activeSectionType(clicked_id);
    }
}

// ze získaných values vytvoří select pro dimenze válcovaného průřezu a jeho popisek
function rolledSectionPart(values, clicked_id, objectId, part) {
    let newElements = [];
    let buttons = [];
    let equalValue = $(`#equalValue${part}`)[0];

    // přidání popisku select inputu
    let labelOfSelect = createNewTextElement('label', 'Dimenze průřezu:', false, '');
    labelOfSelect.setAttribute('class', 'col-form-label');
    labelOfSelect.setAttribute('for', 'dimension_val_option' + part);

    // vytvoření select elementu
    let rolledSelect = document.createElement('select');    // select není input, tudíž není možné volat metodu createNewInput
    rolledSelect.setAttribute('id', 'dimension_val_option' + part);
    rolledSelect.setAttribute('class', 'form-control');
    rolledSelect.setAttribute('onchange', 'editFinalForm(this.id)');
    rolledSelect.setAttribute('name', 'dimension_val' + part);

    // průřez je "L" nebo "RHS" - rozdělí dimenze na select pro rovnoměrné a nerovnoměrné typy tohoto průřezu, vytvoří příslušný
    if ((objectId == 'L_s') || (objectId == 'RHS')) {
        // průřez je rovnostranný a mění se na nerovnostranný
        if (equalValue.value == 'equal') {
            values = splitValues(values, objectId)[0];
        }

        // průřez je nerovnostranný
        else {
            values = splitValues(values, objectId)[1];
        }

        buttons = checkboxesForL(objectId, part);
    }

    // přidání select options do select elementu
    for (i = 0; i < values.length; i++) {
        let optionElement = document.createElement('option');
        optionElement.setAttribute('value', values[i]);
        let optionString = document.createTextNode(values[i]);
        optionElement.append(optionString);
        rolledSelect.appendChild(optionElement);
    }

    // přidání selectu s popiskem, případně i buttonů
    newElements = [labelOfSelect, rolledSelect];

    // pro rovno- a nerovnostranné průřezy vytvoří buttony
    if ((objectId == 'L_s') || (objectId == 'RHS')) {
        newElements.push(buttons);
    }

    return newElements;

    // funkce tvořící buttony pro rovnostranné nebo nerovnostranné průřezy
    function checkboxesForL(objectId, part) {
        // vytvoření popisků pro L a RHS/SHS průřezy
        let equalValue = '';
        let unequalValue = '';

        if (objectId == 'L_s') {
            equalValue = 'Rovnoram.';
            unequalValue = 'Nerovnoram.';
        }

        else if (objectId == 'RHS'){
            equalValue = 'SHS';
            unequalValue = 'RHS';
        }

        // vytvoření divu pro switcher rovnostranného/nerovnostranného průřezu
        let colFormEqual = createNewDiv(['col-12'], false, '');
        let formEqual = createNewDiv(['form-group', 'justify-content-center', 'align-items-center', 'm-2'], true, colFormEqual);

        // vytvoření divu pro checkbox
        let checkboxDiv = createNewDiv(['custom-control', 'custom-switch', 'switchDiv', 'justify-content-between', 'm-1'], true, formEqual);
        //let checkboxDiv = $('#values_part')[0];

        // přidání equal checkboxu (switcher)
        // vytvoření akce pro checkbox (switcher)
        let addFunction = '';

        if (part == '_fir') {
            addFunction += 'editFinalForm(this.id);'
        }

        else if (part == '_sec') {
            addFunction += 'editFinalForm(this.id);'
        }

        // přidání popisků rovnostranného/nerovnostranného průřezu
        let equalLabel = createNewTextElement('label', equalValue, true, checkboxDiv);
        let unequalLabel = createNewTextElement('label', unequalValue, true, checkboxDiv);
        equalLabel.setAttribute('class', 'activeOption px-1');
        unequalLabel.setAttribute('class', 'custom-control-label');

        // nalinkování labelů na checkbox (switcher)
        equalLabel.setAttribute('for', 'custom_' + objectId + '_equal_check' + part);
        unequalLabel.setAttribute('for', 'custom_' + objectId + '_equal_check' + part);

        // přidání checkboxu pro svařovaný/válcovaný průřez
        let equalCheckbox = createNewCheckbox('custom_' + objectId + '_equal_check' + part, 'equal_check' + part, "createSelectValues(this.id, '', 'select'); " + addFunction, false, '');
        equalCheckbox.setAttribute('class', 'custom-control-input');
        checkboxDiv.insertBefore(equalCheckbox, unequalLabel);

        newElements = colFormEqual;

        return newElements;
    }

    // pro průřezy, které to potřebují, rozdělí dimenze pro rovnostranné a nerovnostranné průřezy a vytvoří nový values list pro select, který obsahuje pouze žádané dimenze
    function splitValues(values, objectId) {
        let eqValues = [];
        let uneqValues = [];

        if (objectId == 'L_s') {
            for (k = 0; k < values.length; k++) {
                if (parseInt(values[k].split('x')[0]) == parseInt(values[k].split('x')[1])) {
                    eqValues.push(values[k]);
                }

                else {
                    uneqValues.push(values[k]);
                }
            }
        }

        else if (objectId == 'RHS') {
            for (k = 0; k < values.length; k++) {
                if (values[k].split('x').length != 3) {
                    eqValues.push(values[k]);
                }

                else {
                    uneqValues.push(values[k]);
                }
            }
        }

        l = k;
        while (values[l]) {
            uneqValues.push(values[l]);
            l++;
        }

        let splitted = [eqValues, uneqValues]

        return splitted;
    }
}

// ze získaných values vytvoří inputy a jejich popisky pro svařovaný průřez
function weldedSectionPart(values, objectId, part) {
    let newElements = [];
    let labelsNames = getNamesOfLabels(values, objectId);

    // v cyklu musí být "j", pokud by bylo "i", přejímalo by se z dílčích elementů!
    for (j = 0; j < values.length; j++) {
        let element = createNewInput('text', objectId + '_' + values[j] + part, values[j] + part, 5, 1, 1, 2500, '', 'form-control rounded', false, '');
        element.setAttribute('onchange', 'editFinalForm(this.id)');
        element.setAttribute('oninput', 'checkFormInputs(event)');
        // element.setAttribute('placeholder', '[mm]');
        let label = createNewTextElement('label', labelsNames[j], false, '');
        label.setAttribute('class', 'col-form-label');
        newElements.push(label, element);
    }

    return newElements;

    // funkce pro vytvoření popisků inputů svařovaného průřezu
    function getNamesOfLabels(values, objectId) {
        let labelsNames = [];
        if ((objectId == 'IPE') || (objectId == 'HEB') || (objectId == 'UPE')) {
            labelsNames = ['Výška průřezu:', 'Tloušťka stojiny:', 'Šířka horní pásnice:', 'Tloušťka horní pásnice:', 'Šířka dolní pásnice:', 'Tloušťka dolní pásnice:'];
        }

        else if ((objectId == 'L_s') || (objectId == 'T_s')) {
            labelsNames = ['Výška průřezu:', 'Tloušťka stojiny:', 'Šířka pásnice:', 'Tloušťka pásnice:'];
        }

        else if (objectId == 'RHS') {
            labelsNames = ['Výška průřezu:', 'Tloušťka stojiny:', 'Šířka průřezu:', 'Tloušťka pásnice:'];
        }

        else if (objectId == 'crl') {
            labelsNames = ['Průměr tyče:'];
        }

        else if (objectId == 'rtg') {
            labelsNames = ['Výška plechu:', 'Šířka plechu:'];
        }

        else {
            labelsNames = [];
        }

        return labelsNames;
    }
}

// při kliknutí na checkbox smaže všechny inputy příslušející válcovanému nebo svařovanému typu průřezu
function deleteWrongInputs(objectId, part) {
    let valuesContain = $(`#values_part${part}`)[0];   // div hodnot
    let equalValue = valuesContain.children[0];     // záloha equalValue
    valuesContain.innerHTML = '';       // vymaže všechny hodnoty
    valuesContain.appendChild(equalValue);
}

function activeSectionEqual(part, clicked_id, objectId) {
    let equalValue = $(`#equalValue${part}`)[0];
    let switcher = $(`#custom_${objectId}_equal_check${part}`)[0];

    if (switcher.checked) {
        switcher.classList.remove('activeOption');
        switcher.classList.add('activeOption');
        equalValue.value = 'unequal';
    }

    else {
        switcher.classList.add('activeOption');
        switcher.classList.remove('activeOption');
        equalValue.value = 'equal';
    }
}

function addMirrorAxis(mirrorAxisDiv, part) {

    // vytvoření divu pro checkbox os
    let mirrorCheckboxDiv = createNewDiv(['custom-control', 'custom-switch', 'switchDiv'], true, mirrorAxisDiv);

    // přidání popisků mirroru os
    let xAxisLabel = createNewTextElement('label', 'Kolem X', true, mirrorCheckboxDiv);
    let yAxisLabel = createNewTextElement('label', 'Kolem Y', true, mirrorCheckboxDiv);
    xAxisLabel.setAttribute('class', 'activeOption');
    yAxisLabel.setAttribute('class', 'custom-control-label');

    // nalinkování labelů na checkbox (switcher) os
    xAxisLabel.setAttribute('for', 'custom_mirror_axe' + part);
    yAxisLabel.setAttribute('for', 'custom_mirror_axe' + part);

    // přidání checkboxu pro přepínání mirror os
    this.mirrorCheckbox = createNewCheckbox('custom_mirror_axe' + part, 'custom_mirror_axe' + part, 'activeMirrorAxe(this.id); editFinalForm(this.id);', true, mirrorCheckboxDiv);
    this.mirrorCheckbox.setAttribute('class', 'custom-control-input');
    mirrorCheckboxDiv.insertBefore(this.mirrorCheckbox, yAxisLabel);
}