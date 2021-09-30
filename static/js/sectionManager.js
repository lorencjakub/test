// funkce pro uživatelskou správu souborů


function sectionSave() {
    let request = new XMLHttpRequest();
    let source = $('#section_picture_div')[0].children[0].getAttribute('src');
    image = source.split('\\')[source.split('\\').length - 1];
    image = image.substr(0, image.length - 4);

    let msg = { msg: image };
    let msgjson = JSON.stringify(msg);

    request.onload = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            $('#sectionSave')[0].setAttribute('disabled', 'true');
            let saveButtonsBar = $('#results')[0];
            let resultAlertSuccess = createNewDiv(['alert', 'alert-success', 'text-center'], true, saveButtonsBar);
            resultAlertSuccess.innerHTML = `Průřez úspěšně uložen! Zbývající volné sloty: ${this.responseText}`;
        }

        else if (this.readyState === XMLHttpRequest.DONE && this.status != 200){
            $('#sectionSave')[0].setAttribute('disabled', 'true');
            let saveButtonsBar = $('#results')[0];
            let resultAlertError = createNewDiv(['alert', 'alert-danger', 'text-center'], true, saveButtonsBar);
            resultAlertError.innerHTML = this.responseText;
        }
    };

    request.open('POST', '/section_save', true);
    request.setRequestHeader("content-type", "application/json;charset=UTF-8");
    request.send(msgjson);
}


function renameSave(oldName, newName) {
    let request = new XMLHttpRequest();
    let msg = { newName: newName, oldName: oldName };
    let msgjson = JSON.stringify(msg);

    request.onload = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            $('#sectionSave')[0].setAttribute('disabled', 'true');
            let saveButtonsBar = $('.modal-footer')[0];
            let resultAlertSuccess = createNewDiv(['alert', 'alert-success', 'text-center'], true, saveButtonsBar);
            resultAlertSuccess.innerHTML = "Průřez úspěšně přejmenován!";
        }

        else if (this.readyState === XMLHttpRequest.DONE && this.status != 200){
            $('#sectionSave')[0].setAttribute('disabled', 'true');
            let saveButtonsBar = $('.modal-footer')[0];
            let resultAlertError = createNewDiv(['alert', 'alert-danger', 'text-center'], true, saveButtonsBar);
            resultAlertError.innerHTML = this.responseText;
        }
    };

    request.open('POST', '/rename_user_section', true);
    request.setRequestHeader("content-type", "application/json;charset=UTF-8");
    request.send(msgjson);
}


function deleteSave(section) {
    let request = new XMLHttpRequest();
    let source = section.getAttribute('src');
    image = source.split('/')[source.split('/').length - 1];
    image = image.substr(0, image.length - 4);

    let msg = { msg: image };
    let msgjson = JSON.stringify(msg);

    request.onload = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            $('#sectionSave')[0].setAttribute('disabled', 'true');
            let saveButtonsBar = $('.modal-footer')[0];
            let resultAlertSuccess = createNewDiv(['alert', 'alert-success', 'text-center'], true, saveButtonsBar);
            resultAlertSuccess.innerHTML = "Průřez úspěšně smazán!";
        }

        else if (this.readyState === XMLHttpRequest.DONE && this.status != 200){
            $('#sectionSave')[0].setAttribute('disabled', 'true');
            let saveButtonsBar = $('.modal-footer')[0];
            let resultAlertError = createNewDiv(['alert', 'alert-danger', 'text-center'], true, saveButtonsBar);
            resultAlertError.innerHTML = this.responseText;
        }
    };

    request.open('POST', '/section_delete', true);
    request.setRequestHeader("content-type", "application/json;charset=UTF-8");
    request.send(msgjson);
}


function createModalDialog() {
        // modal dialog
        let activeCard = $('#selected_section_card')[0];

        let modalDiv = createNewDiv(['modal', 'fade'], true, activeCard);
        modalDiv.setAttribute('id', 'sectionManager');
        modalDiv.setAttribute('tabindex', '-1');
        modalDiv.setAttribute('data-backdrop', 'static');
        modalDiv.setAttribute('data-keyboard', 'false');
        modalDiv.setAttribute('aria-labelledby', 'manager-label');
        modalDiv.setAttribute('aria-hidden', 'true');

        let modalDialog = createNewDiv(['modal-dialog', 'modal-dialog-scrollable', 'modal-dialog-centered'], true, modalDiv);
        let modalContent = createNewDiv(['modal-content'], true, modalDialog);
        let modalHeader = createNewDiv(['modal-header', 'justify-content-center'], true, modalContent);

        let modalTitle = createNewTextElement("h3", "Moje uložené průřezy", true, modalHeader);
        modalTitle.setAttribute('class', 'modal-title');
        modalTitle.setAttribute('id', 'manager-label');

        let modalBody = createNewDiv(['modal-body'], true, modalContent);
        let progressButton = document.createElement('button');
        progressButton.setAttribute('type', 'button');
        progressButton.setAttribute('class', 'btn btn-primary');
        progressButton.setAttribute('disabled', 'true');
        progressButton.innerHTML = 'Získávám průřezy...    '
        modalBody.append(progressButton);

        let spinnerSpan = createNewTextElement('span', '', true, progressButton);
        spinnerSpan.setAttribute('class', 'spinner-border spinner-border-sm');
        spinnerSpan.setAttribute('role', 'status');
        spinnerSpan.setAttribute('aria-hidden', 'true');


        let modalFooter = createNewDiv(['modal-footer', 'justify-content-center'], true, modalContent);
        let footerRow = createNewDiv(['row', 'justify-content-around'], true, modalFooter);
        let selectCol = createNewDiv(['col-5'], true, footerRow);
        let selectButton = createNewButton('selectSection', 'selectSection', 'chooseUserSections();', 'Vybrat', true, selectCol);
        selectButton.setAttribute('class', 'btn btn-secondary');

        let renameCol = createNewDiv(['col-5'], true, footerRow);
        let renameButton = createNewButton('renameSection', 'renameSection', 'renameUserSections();', 'Přejmenovat', true, renameCol);
        renameButton.setAttribute('class', 'btn btn-secondary');

        let deleteCol = createNewDiv(['col-5'], true, footerRow);
        let deleteButton = createNewButton('deleteSection', 'deleteSection', 'deleteUserSections();', 'Smazat', true, deleteCol);
        deleteButton.setAttribute('class', 'btn btn-secondary');

        let cancelCol = createNewDiv(['col-5'], true, footerRow);
        let cancelButton = createNewButton('cancelSection', 'cancelSection', 'checkSubmitButton();', 'Zavřít', true, cancelCol);
        cancelButton.setAttribute('class', 'btn btn-secondary');
        cancelButton.setAttribute('data-dismiss', 'modal');
}


function getSavedSections() {
    let request = new XMLHttpRequest();
    let msg = { msg: 'load_request' };
    request.open('POST', '/load_section', true);
    request.setRequestHeader("content-type", "application/json;charset=UTF-8");
    request.send(JSON.stringify(msg));

    request.onreadystatechange = function() {
        if ((this.readyState == 4) && (this.status == 200)) {
            let modalBody = $('#sectionManager')[0].children[0].children[0].children[1];
            modalBody.innerHTML = '';
            let result = JSON.parse(request.responseText);
            let pictureRow = createNewDiv(['row', 'justify-content-around'], true, modalBody);

            if (typeof(result) != "string") {
                files = result['files'];
                names = result['names'];

                for (k = 0; k < files.length; k++) {
                    let element = createNewDiv(['col-4', 'justify-content-around', 'align-items-center', 'p-1', 'section-bg-img'], true, pictureRow);
                    element.setAttribute('id', names[k]);
                    element.setAttribute('onclick', 'selectThisSavedSection(this.id);');
                    let elementPicture = document.createElement('img');
                    elementPicture.setAttribute('src', files[k]);
                    elementPicture.setAttribute('class', 'img-fluid nonactiveSection');
                    element.append(elementPicture);

                    let elementMask = createNewDiv(['mask'], true, element);
                    elementMask.setAttribute('style', 'background-color: rgba(0, 0, 0, 0.6)');
                    let maskTextDiv = createNewDiv(['d-flex', 'justify-content-center', 'align-items-center', 'h-50'], true, elementMask);
                    let sectionTitle =  createNewDiv(['text-white'], true, maskTextDiv);
                    let sectionName = createNewTextElement('p', names[k], true, sectionTitle);
                }
            }

            else {
                modalBody.innerHTML = result;
            }
        }

        else if ((this.readyState == 4) && (this.status != 200)) {
            let modalBody = $('#sectionManager')[0].children[0].children[0].children[1];
            modalBody.innerHTML = 'Chyba při načítání!';
        }
    };
}


function selectThisSavedSection(clicked_id) {
    if ($('.alert').length != 0) {
        $('.alert')[0].parentElement.removeChild($('.alert')[0]);
    }

    let savedSections = $('[class*="section-bg-img"]');

    for (m = 0; m < savedSections.length; m++) {
        savedSections[m].children[0].setAttribute('class', 'img-fluid nonactiveSection');
    }

    let selectedSection = $(`#${clicked_id}`)[0];
    selectedSection.children[0].classList.remove('nonactiveSection');
    selectedSection.children[0].classList.add('selectedSection');
}


function chooseUserSections() {
    if ($('.alert').length != 0) {
        $('.alert')[0].parentElement.removeChild($('.alert')[0]);
    }

    let savedSections = $('[class*="section-bg-img"]');
    let sectionName = '';
    let imgNameParts = '';
    let sectionImage = '';

    let selected = 0;
    for (m = 0; m < savedSections.length; m++) {
        if (savedSections[m].children[0].getAttribute('class').includes('selectedSection')) {
            selected += 1;
            sectionImage = savedSections[m].children[0].getAttribute('src');
            imgNameParts = sectionImage.split('/');
            sectionName = savedSections[m].children[1].children[0].textContent;
        }
    }

    let imageName = imgNameParts[imgNameParts.length - 1];

    if (!window.location.href.includes('frame')) {
        if (selected != 0) {
                if (!$('#name_part')[0]) {
                    $('#sectionManager').modal('toggle');   // odvolá modal dialog

                    //viditelný input obsahující jméno průřezu
                    let nameRow = createNewDiv(['form-row', 'justify-content-center', 'align-items-center', 'mt-3'], false, '');
                    nameRow.setAttribute('id', 'name_part');

                    //vytvoření a vložení form-group pro mesh label
                    let nameGroupLabel = createNewDiv(['col-6'], true, nameRow);

                    //vytvoření a vložení form-group pro mesh label
                    let nameGroupInput = createNewDiv(['align-items-center'], true, nameRow);

                    // popisek inputu názvu průřezu
                    let labelOfName = createNewTextElement('label', `Průřez: ${sectionName}`, true, nameGroupLabel);
                    labelOfName.setAttribute('class', 'col-form-label');
                    labelOfName.setAttribute('for', 'name_value');

                    // vytvoření inputu s názvem průřezu
                    let nameValue = '';

                    if (window.location.href.includes('stresses')) {
                        nameValue = createNewInput('hidden', 'section_name', '', '', '', '', '', imageName, '', true, nameGroupInput);
                    }

                    else {
                        nameValue = createNewInput('hidden', 'section_name', 'section_name', '', '', '', '', imageName, '', true, nameGroupInput);
                    }

                    nameValue.setAttribute('class', 'form-control rounded');

                    $('[class="input_formular"]')[0].insertBefore(nameRow, $('[id*="calculate"]')[0]);
                    // $('[class="input_formular"]')[0].insertBefore(picture, $('[id*="calculate"]')[0]);

                    if (!window.location.href.includes('stresses')) {
                        let optionsRow = createNewDiv(['col-12', 'form-row', 'justify-content-left', 'align-items-center', 'ml-5', 'my-3'], false, '');
                        $('[class="input_formular"]')[0].insertBefore(optionsRow, $('[id*="calculate"]')[0]);
                        createCalculateOptions(optionsRow);
                    }
            }

            else {
                $('#sectionManager').modal('toggle');   // odvolá modal dialog
                $('[for="name_value"]')[0].innerText = `Průřez: ${sectionName}`;
                $('#section_name')[0].value = imageName;
            }

            /*
            let mainPicture = '';

            if (window.location.href.includes('stresses')) {
                mainPicture = $('#main_form_pic')[0];
            }

            else {
                let objectId = $('legend')[0].innerText.replace('Průřez: ', '');
                mainPicture = $(`#${objectId}`)[0].children[1].children[0].children[0];
            }

            mainPicture.setAttribute('src', sectionImage);
            */
        }

        else {
            selectSectionFirstPlease();
        }
    }

    else {
        let sectionNumber = $('#sectionManager [class="modal-title"]')[0].innerText.split('č. ')[1];
        chooseCrossSection(`${sectionName}:${imageName}`, sectionNumber);
        $('#sectionManager').modal('toggle');   // odvolá modal dialog
    }

    checkSubmitButton();
}


function renameUserSections() {
    if ($('.alert').length != 0) {
        $('.alert')[0].parentElement.removeChild($('.alert')[0]);
    }

    let savedSections = $('[class*="section-bg-img"]');
    let sectionName = '';
    let imgNameParts = '';
    let sectionImage = '';

    let selected = 0;
    for (m = 0; m < savedSections.length; m++) {
        if (savedSections[m].children[0].getAttribute('class').includes('selectedSection')) {
            selected += 1;
            sectionImage = savedSections[m].children[0].getAttribute('src');
            imgNameParts = sectionImage.split('/');
            sectionName = savedSections[m].id;
        }
    }

    if (selected != 0) {
        let modalFooter = $('[class*="modal-footer"]')[0];
        modalFooter.children[0].setAttribute('style', 'display: none;');

        // ovládání a input pro text
        let bodyRow = createNewDiv(['input-group', 'justify-content-around'], true, modalFooter);
        let bodyInput = document.createElement('input');
        bodyInput.setAttribute('type', 'text');
        bodyInput.setAttribute('id', 'newSectionName');
        bodyInput.setAttribute('placeholder', 'Zadej nové jméno průřezu');
        bodyRow.append(bodyInput);
        let confirmButton = createNewButton('renameConfirmButton', 'renameConfirmButton', 'sectionNameDone("confirm");', 'Potvrdit', true, bodyRow);
        confirmButton.setAttribute('class', 'btn-secondary');
        let closeButton = createNewButton('renameCloseButton', 'renameCloseButton', 'sectionNameDone("close");', 'Zrušit', true, bodyRow);
        closeButton.setAttribute('class', 'btn-secondary');
    }

    else {
        selectSectionFirstPlease();
    }
}


function deleteUserSections() {
    if ($('.alert').length != 0) {
        $('.alert')[0].parentElement.removeChild($('.alert')[0]);
    }

    let savedSections = $('[class*="section-bg-img"]');
    let sectionName = '';
    let imgNameParts = '';
    let sectionImage = '';

    let selected = 0;
    for (m = 0; m < savedSections.length; m++) {
        if (savedSections[m].children[0].getAttribute('class').includes('selectedSection')) {
            selected += 1;
            sectionImage = savedSections[m].children[0].getAttribute('src');
            imgNameParts = sectionImage.split('/');
            sectionName = savedSections[m].id;
        }
    }

    if (selected != 0) {
        let modalFooter = $('[class*="modal-footer"]')[0];
        modalFooter.children[0].setAttribute('style', 'display: none;');

        // ovládání a input pro text
        let bodyRow = createNewDiv(['input-group', 'justify-content-between'], true, modalFooter);
        let confirmDelete = createNewTextElement('h4', 'Opravdu chceš smazat tento průřez?', true, bodyRow);
        let confirmButton = createNewButton('deleteConfirmButton', 'deleteConfirmButton', 'deleteSectionDone("confirm");', 'Ano', true, bodyRow);
        confirmButton.setAttribute('class', 'btn-secondary');
        let closeButton = createNewButton('deleteCloseButton', 'deleteCloseButton', 'deleteSectionDone("close");', 'Ne', true, bodyRow);
        closeButton.setAttribute('class', 'btn-secondary');
    }

    else {
        selectSectionFirstPlease();
    }
}


function selectSectionFirstPlease() {
    alert('Nejdřív vyber průřez!');
}


function sectionNameDone(action) {
    let modalFooter = $('[class*="modal-footer"]')[0];
    modalFooter.children[0].removeAttribute('style');

    let newSectionName = $('#newSectionName')[0].value;
    modalFooter.removeChild(modalFooter.lastChild);

    if (action == 'confirm') {
        let savedSections = $('[class*="section-bg-img"]');

        // PŘIDAT PODMÍNKU, POKUD NEEXISTUJE CHYBOVÝ ALERT, MŮŽE PROBĚHNOUT LOOP PRO PŘEJMENOVÁNÍ PRŮŘEZU V MODAL DIALOGU

        for (m = 0; m < savedSections.length; m++) {
            if (savedSections[m].children[0].getAttribute('class').includes('selectedSection')) {
                renameSave(savedSections[m].children[1].children[0].children[0].children[0].innerHTML, newSectionName);
                savedSections[m].children[1].children[0].children[0].innerHTML = newSectionName;
            }
        }
    }
}


function deleteSectionDone(action) {
    let modalFooter = $('[class*="modal-footer"]')[0];
    modalFooter.children[0].removeAttribute('style');
    modalFooter.removeChild(modalFooter.lastChild);

    if (action == 'confirm') {
        let savedSections = $('[class*="section-bg-img"]');



        for (m = 0; m < savedSections.length; m++) {
            if (savedSections[m].children[0].getAttribute('class').includes('selectedSection')) {
                let sectionElement = savedSections[m];
                let divOfSections = sectionElement.parentElement;
                deleteSave(sectionElement.children[0]);
                // PŘIDAT PODMÍNKU, POKUD NEEXISTUJE CHYBOVÝ ALERT, MŮŽE PROBĚHNOUT LOOP PRO PŘEJMENOVÁNÍ PRŮŘEZU V MODAL DIALOGU

                for (n = 0; n < divOfSections.children.length; n++) {
                    if (divOfSections.children[n] == sectionElement) {
                        divOfSections.removeChild(divOfSections.children[n]);
                    }
                }
            }
        }
    }
}


function pdfSave() {
    // vrátí slovník elementů z divu results a stavu elementů k tisku, podle aktuálního zobrazení na stránce
    let elements = getResultElements()[0];
    let resultKeys = getResultElements()[1];

    let pdfFile = new PdfStructure(elements, resultKeys);
}


function getResultElements() {
    let resultKeys = [];
    let resultsDiv = $('#results')[0].children;
    let elements = {};

    //if (window.location.href.includes('stresses')) {
    for (i = 1; i < resultsDiv.length - 1; i++) {
        if (resultsDiv[i].children.length != 0) {
            let key = resultsDiv[i].children[1].id;
            eval(`elements.${key} = resultsDiv[i].children[1].cloneNode(true);`);
            resultKeys.push(key);
        }
    }

    let resultsHeader = $('[class*="cross_section_type"]')[0].cloneNode(true);
    elements.resultsHeader = resultsHeader;
    resultKeys.resultsHeader = resultsHeader;
    /*}

    let resultsHeader = $('[class*="cross_section_type"]')[0].cloneNode(true);
    let elCgAxis = $('#elasticCgAxisTable_div')[0].parentElement.cloneNode(true);
    let elMainAxis = $('#elasticMainAxisTable_div')[0].parentElement.cloneNode(true);
    let plastic = $('#plasticTable_div')[0].parentElement.cloneNode(true);
    let warping = $('#torsionalAndWarpingTable_div')[0].parentElement.cloneNode(true);
    let image = $('#section_picture_div')[0].parentElement.cloneNode(true);

    let elements = {'resultsHeader': resultsHeader,
                    'elCgAxis': elCgAxis,
                    'elMainAxis': elMainAxis,
                    'plastic': plastic,
                    'warping': warping,
                    'image': image
    };
    */

    return [elements, resultKeys]
}


function checkSubmitButton() {
    selectedSection = '';

    try {
        $('#sectionSave')[0].removeAttribute('disabled');

        if (window.location.href.includes('stresses')) {
            if (($("[for='name_value']")[0].text != '') && ($("#stressing_forces")[0].value != 0)) {
                $('#usr_calculate')[0].classList.remove('disabledSubmit');
                $('#usr_calculate')[0].classList.add('enableSubmit');
                $('#usr_calculate')[0].removeAttribute('disabled');
            }

            else {
                $('#usr_calculate')[0].classList.add('disabledSubmit');
                $('#usr_calculate')[0].classList.remove('enableSubmit');
                $('#usr_calculate')[0].setAttribute('disabled', 'true');
            }
        }

        else {
            if ($("[for='name_value']")[0].innerText != '') {
                $('#usr_calculate')[0].classList.remove('disabledSubmit');
                $('#usr_calculate')[0].classList.add('enableSubmit');
                $('#usr_calculate')[0].removeAttribute('disabled');
            }
        }
    }

    catch(err) {
        $('#usr_calculate')[0].classList.add('disabledSubmit');
        $('#usr_calculate')[0].classList.remove('enableSubmit');
        $('#usr_calculate')[0].setAttribute('disabled', 'true');
    }
}