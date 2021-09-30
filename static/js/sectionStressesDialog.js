function editCreatorFormular() {
    // smaže close button z formuláře
    let formCloseButton = $('button[id$="_bar_switch_close"]')[0];
    formCloseButton.parentElement.removeChild(formCloseButton);

    let formSubmitButtons = $('[type="submit"][id!="usr_calculate"]')[0];
    formSubmitButtons.setAttribute('style', 'display: none');
    formSubmitButtons.setAttribute('onchange', 'checkValidityOfSection(this.id);');

    $('#selected_section_card')[0].removeAttribute('style');
}


function checkValidityOfSection(active_submit) {
    if ($(`#${active_submit}`)[0].getAttribute('class').includes('enableSubmit')) {
        $('#selectCreatorSection')[0].removeAttribute('disabled');
    }

    else {
        $('#selectCreatorSection')[0].setAttribute('disabled', '');
    }
}


function confirmNewSection() {
    let sectionName = $('input[name="dimension_type"]')[0].value;
    // let sectionImage = $('#selected_section_card')[0].children[0].children[0].children[0].children[0];
    // let imageSource = sectionImage.getAttribute('src');
    let newSectionForm = '';
    let formControls = $('form[id!="usr_form"] [class*="form-control"]');
    let newSectionData = '';

    if (sectionName == 'crl') {
        sectionName = 'Kulatina';
        newSectionForm = $('#selected_section_card')[0].children[0].children[0].children[0].children[0];
    }

    else if (sectionName == 'rtg') {
        sectionName = 'Plech';
        newSectionForm = $('#selected_section_card')[0].children[0].children[0].children[0].children[0];
    }

    else if (sectionName == 'cnv') {
        sectionName = 'Grafický';
        let canvas = $('#myCanvas')[0];
        // imageSource = canvas.toDataURL();
        // imageSource = "static/pictures/svg/cnv_section_pic.svg";
        formControls = $('form[id!="usr_form"] [class*="form-control"], [class*="noinput"]');
        newSectionForm = $('#selected_section_card')[0].children[0].children[0];
    }

    else if (sectionName == 'mrg') {
        sectionName = 'Složený';
        let newSectionForm = $('#selected_section_card')[0].children[0];
        // imageSource = "static/pictures/svg/mrg_section_pic.svg";
    }

    else {
        newSectionForm = $('#selected_section_card')[0].children[0].children[0].children[0].children[0];
    }

    if (!window.location.href.includes('frame')) {
        for (k = 0; k < formControls.length; k++) {
            newSectionData += `${formControls[k].name}=${formControls[k].value}&`;
        }
    }

    else {
        for (k = 0; k < formControls.length; k++) {
            newSectionData += `${formControls[k].name}:${formControls[k].value},`;
        }
    }

    newSectionData = newSectionData.substr(0, newSectionData.length - 1);

    $('#sectionCreator').modal('toggle');   // odvolá modal dialog

    // let mainPicture = $('#main_form_pic')[0];

    if (!window.location.href.includes('frame')) {
        // mainPicture.setAttribute('src', imageSource);

        if (!$('#name_part')[0]) {  // připíše do formuláře vybraný průřez, pokud již neexistuje, jinak jej pouze upraví
            //viditelný input obsahující jméno průřezu
            let nameRow = createNewDiv(['form-row', 'justify-content-between', 'align-items-center'], false, '');
            nameRow.setAttribute('id', 'name_part');

            //vytvoření a vložení form-group pro mesh label
            let nameGroupLabel = createNewDiv(['col-12', 'text-center'], true, nameRow);

            //vytvoření a vložení form-group pro mesh label
            let nameGroupInput = createNewDiv(['col'], true, nameRow);

            // popisek inputu názvu průřezu
            let labelOfName = createNewTextElement('label', `Průřez: ${sectionName}`, true, nameGroupLabel);
            labelOfName.setAttribute('class', 'col-form-label');
            labelOfName.setAttribute('for', 'name_value');

            // vytvoření inputu s názvem průřezu
            let nameValue = createNewInput('hidden', 'section_name', '', '', '', '', '', newSectionData, '', true, nameGroupInput);
            nameValue.setAttribute('class', 'rounded');

            $('[class="input_formular"]')[0].insertBefore(nameRow, $('[id*="calculate"]')[0]);
            // $('[class="input_formular"]')[0].insertBefore(picture, $('[id*="calculate"]')[0]);
        }

        else {
            $('[for="name_value"]')[0].innerText = `Průřez: ${sectionName}`;
            $('#section_name')[0].value = newSectionData;
        }
        // přesunuto sem z řádku 120
        let newSectionType = newSectionData.replace('dimension_type=', '').substr(0, 3);
    }

    else {
        let sectionNumber = $('#sectionCreator [class="modal-title"]')[0].innerText.split('č. ')[1];
        chooseCrossSection(newSectionData, sectionNumber);

    }

    $('#section_icons').collapse('toggle');

    checkSubmitButton();
    $('#selectCreatorSection')[0].setAttribute('disabled', 'true');
    $('#selected_section_card')[0].innerHTML = '';
    $('#selected_section_card').collapse('toggle');;

}


function cancelCreator() {
    let sectionType = $('#selected_section_card .input_formular')[0].id.substr(0, 3);
    $('#selected_section_card').collapse('toggle');
    $('#selected_section_card')[0].innerHTML = '';
    // createNewCrossSection(`${sectionType}_bar_switch`);
}


function getSavedStressedSections() {
    if ($('#section_icons')[0].getAttribute('class').includes('show')) {
        $('#section_icons').collapse('toggle');
    }

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


function defineInternalForces(clicked_id) {
    let internalForce = clicked_id.substr(0, 3);
    let internalForceInput = $(`[name="${internalForce}"]`)[0];

    if ($(`#${clicked_id}`)[0].checked == true) {
        internalForceInput.removeAttribute('disabled');

        if ("Nxx, Vyy, Vzz".includes(internalForce)) {
            internalForceInput.setAttribute('placeholder', 'Zadej v kN.');
        }

        else {
            internalForceInput.setAttribute('placeholder', 'Zadej v kNm.');
        }
    }

    else {
        internalForceInput.removeAttribute('placeholder');
        internalForceInput.setAttribute('disabled', '');
        internalForceInput.value = '';
    }

    updateForcesData();
    checkSubmitButton();
}


function updateForcesData() {
    let forcesData = '';
    let emptyForces = 0;
    let invalidForces = 0;
    for (m = 0; m < $('[class*="internalForces"]').length; m++) {
        $('[class*="internalForces"]')[m].value = $('[class*="internalForces"]')[m].value.replace(',', '.');
        if (($('[class*="internalForces"]')[m].value != '') && (!isNaN($('[class*="internalForces"]')[m].value))) {
            forcesData += `${$('[class*="internalForces"]')[m].getAttribute('name')}:${$('[class*="internalForces"]')[m].value}|`;
        }

        else if (isNaN($('[class*="internalForces"]')[m].value)) {
            invalidForces += 1;
            forcesData += `${$('[class*="internalForces"]')[m].getAttribute('name')}:0|`;
        }

        else {
            emptyForces += 1;
            forcesData += `${$('[class*="internalForces"]')[m].getAttribute('name')}:0|`;
        }
    }

    if ((emptyForces != $('[class*="internalForces"]').length) && (invalidForces == 0)) {
        forcesData = forcesData.substr(0, forcesData.length - 1);
        $('#stressing_forces')[0].value = forcesData;
    }

    else {
        $('#stressing_forces')[0].value = 0;
    }

    checkSubmitButton();
}


function stressCalculateOption(clicked_id) {
    if ($(`#${clicked_id}`)[0].checked == false) {
        $(`[name=${clicked_id}]`)[0].value = "no";
    }

    else {
        $(`[name=${clicked_id}]`)[0].value = "yes";
    }
}

function checkValidStressedNewSection(submitButton) {
    if (!submitButton.getAttribute('class').includes('disabledSubmit')) {
        $('#selectCreatorSection')[0].removeAttribute('disabled');
    }

    else {
        $('#selectCreatorSection')[0].setAttribute('disabled', 'true');
    }
}


function refreshBigIcons() {
    let bigIcons = $('[id$="bar_switch"]');

    for (let o = 0; o < bigIcons.length - 1; o++) {
        bigIcons[o].classList.remove('activeBigIcon');
    }
}