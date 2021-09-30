// ---  MODUL PRO VALIDACE INPUTŮ VE FORMULÁŘÍCH PRŮŘEZŮ --- //

function checkFormInputs(event) {
    setTimeout(function() {
        let actualElement = '';

        try {
            if (!event.includes('check')) {
                actualElement = event.target;
            }

            else {
                actualElement = $(`#${event}`)[0];
            }
        }

        catch(err) {
            actualElement = event.target;
        }

        let actualForm = actualElement;

        while (!actualForm.id.includes('_form')) { // z aktuálního elementu se přes parent elementy dostane až k celkovému formuláři
            actualForm = actualForm.parentElement;
        }

        let errors = [];
        let submitButton = '';
        let formData = $(`#${actualForm.getAttribute("id")} [class*="form-control"]`);

        if (actualForm.id.includes('cnv')) {
            checkCanvasForm() == null ? errors.push() : errors.push('error');
            submitButton = $('#cnv_calculate')[0];
        }

        else {
            for (let p = 0; p < formData.length; p++) {
                if (!/geometric|warping|plastic/.test(formData[p].getAttribute('id'))) {
                    let result = formInputValidation(formData[p], actualForm);
                    let error = result[0];
                    submitButton = result[1];

                    if (error != null) {
                        errors.push(error);
                        formData[p].parentElement.parentElement.children[0].classList.add('align-items-center');
                    }

                    else {
                        formData[p].parentElement.parentElement.children[0].classList.remove('align-items-center');
                    }
                }
            }
        }

        if (/fir|sec|mrg/.test(actualForm.id)) {
            if (errors.length == 0) {
                submitButton.removeAttribute('disabled');
                submitButton.classList.remove('disabledSubmit');
                submitButton.classList.add('enableSubmit');
            }

            checkMergedSection();
        }

        else {
            if (errors.length == 0) {
                submitButton.removeAttribute('disabled');
                submitButton.classList.remove('disabledSubmit');
                submitButton.classList.add('enableSubmit');
            }

            else {
                submitButton.setAttribute('disabled', '');
                submitButton.classList.remove('enableSubmit');
                submitButton.classList.add('disabledSubmit');
            }

            if ((window.location.href.includes('stresses')) || (window.location.href.includes('frame'))) {
                checkValidStressedNewSection(submitButton);
            }
        }
    }, 510);
}


// funkce pro validace podle bootstrapu
function formInputValidation(actualInput, actualForm) {
    let actualFormGroup = actualInput.parentNode;   // form group daného inputu
    let errorMessage = actualFormGroup.children[0];
    let submitButton = '';
    let formData = $('[class*="form-control"]');

    if (actualInput.id.includes('fir')) {
        let allSubmitButtons = $(':submit');

        let r = 0;
        while (!allSubmitButtons[r].id.includes('fir')) {
            r++;
        }
        submitButton = allSubmitButtons[r];
    }

    else if (actualInput.id.includes('sec')) {
        let allSubmitButtons = $(':submit');

        let r = 0;
        while (!allSubmitButtons[r].id.includes('sec')) {
            r++;
        }
        submitButton = allSubmitButtons[r];
    }

    else {
        submitButton = actualForm.children[actualForm.children.length - 1];
    }

    if ((errorMessage.tagName != "INPUT") && (errorMessage.type != "text")) {
        return [null, submitButton];
    }

    else if (/merged_hole|rotate/.test(actualInput.id)) {
        errorMessage.innerHTML = '';
        return [null, submitButton];
    }

    let random = Math.random() + '!';

    // pokud třída inputu již obsahuje informace o validaci, nastaví ji na defaultní invalid
    if (actualInput.getAttribute('class').includes('valid')) {
        actualInput.classList.remove('is-invalid');
        actualInput.classList.remove('is-valid');
        actualInput.classList.add('is-invalid');    // defaultně je input nevalidní a až pokud se prokáže, že je v pořádku, stane se validním
    }

    else {
        actualInput.classList.add('is-invalid');
    }

    actualInput.setAttribute('title', '');

    let inputValue = actualInput.value;

    if (inputValue != '') {
        let newInputValue = inputValue.replace(",", ".");   // nahradí desetinnou čásku za desetinnou tečku
        actualInput.value = newInputValue;
        inputValue = Number(String(newInputValue));     // přeuloží proměnnou do podoby s desetinnou tečkou
    }

    if (isNaN(inputValue)) {      //--- input nevyplněný číslem ---//
        errorMessage.setAttribute('data-toggle', 'tooltip');
        errorMessage.setAttribute('data-placement', 'right');
        errorMessage.setAttribute('data-original-title', 'Zadejte prosím číselnou hodnotu.');
        errorMessage.setAttribute('onmouseenter', 'invalidInputTooltip(this.id)');
        errorMessage.setAttribute('onmouseleave', 'invalidInputTooltip(this.id)');

        return ["NaN", submitButton];
    }

    else if (String(inputValue).length == 0) {      //--- nevyplněný input ---//
        if (!/merged_hole|rotate/.test(actualInput.id)) {
            errorMessage.setAttribute('data-toggle', 'tooltip');
            errorMessage.setAttribute('data-placement', 'right');
            errorMessage.setAttribute('data-original-title', 'Zadejte prosím hodnotu.');
            errorMessage.setAttribute('onmouseenter', 'invalidInputTooltip(this.id)');
            errorMessage.setAttribute('onmouseleave', 'invalidInputTooltip(this.id)');

            return ["empty", submitButton];
        }
    }

    else if ((inputValue <= 0) && (String(inputValue).length > 0)) {      //--- nepřijme záporný nebo nulový vstup ---//
        if (!/merged_hole|rotate|shift/.test(actualInput.id)) {
            errorMessage.setAttribute('data-toggle', 'tooltip');
            errorMessage.setAttribute('data-placement', 'right');
            errorMessage.setAttribute('data-original-title', 'Zadejte prosím kladné číslo.');
            errorMessage.setAttribute('onmouseenter', 'invalidInputTooltip(this.id)');
            errorMessage.setAttribute('onmouseleave', 'invalidInputTooltip(this.id)');

            return ["nonpositiv", submitButton];
        }
    }

    else if ((inputValue.length > 6) || (inputValue > 2500)) {           //--- nepřijme více než 6 znaků nebo rozměr větší než 5000
        errorMessage.setAttribute('data-toggle', 'tooltip');
        errorMessage.setAttribute('data-placement', 'right');
        errorMessage.setAttribute('data-original-title', 'Příliš velké číslo.');
        errorMessage.setAttribute('onmouseenter', 'invalidInputTooltip(this.id)');
        errorMessage.setAttribute('onmouseleave', 'invalidInputTooltip(this.id)');

        return ["big", submitButton];
    }

    else if ((inputValue < 0.1) && (parseFloat(inputValue) != 0)) {         //--- nepřijme vstup menší než 0.1 ---//
        errorMessage.setAttribute('data-toggle', 'tooltip');
        errorMessage.setAttribute('data-placement', 'right');
        errorMessage.setAttribute('data-original-title', 'Příliš malé číslo.');
        errorMessage.setAttribute('onmouseenter', 'invalidInputTooltip(this.id)');
        errorMessage.setAttribute('onmouseleave', 'invalidInputTooltip(this.id)');

        return ["small", submitButton];
    }

    else {           //--- vstupem je kladné číslo přijatelné velikosti ---//
        actualInput.classList.remove('is-invalid');
        actualInput.classList.add('is-valid');
        errorMessage.removeAttribute('data-toggle');
        errorMessage.removeAttribute('data-placement');
        errorMessage.removeAttribute('data-original-title');
        errorMessage.removeAttribute('onmouseenter');
        errorMessage.removeAttribute('onmouseleave');
    }

    let valuesOfFormData = [];

    for (t = 0; t < formData.length; t++) {
        if (!isNaN(parseFloat(formData[t].value))) {
            valuesOfFormData.push(parseFloat(formData[t].value));
        }
    }

    let minimumValue = Math.min.apply(Math, valuesOfFormData);
    let meshValue = submitButton.parentElement.children[submitButton.parentElement.children.length - 2].children[1].children[0];

    // omezení meshValue na polovinu nejmenšího rozměru nebo na 10 mm
    if ((actualInput.getAttribute('id').includes('mesh_value')) && ((parseFloat(meshValue.value) < 0.5 * minimumValue) || (parseFloat(meshValue.value) < 10))) {
        errorMessage.setAttribute('data-toggle', 'tooltip');
        errorMessage.setAttribute('data-placement', 'right');
        errorMessage.setAttribute('data-original-title', 'Příliš jemná síť.');
        errorMessage.setAttribute('onmouseenter', 'invalidInputTooltip(this.id)');
        errorMessage.setAttribute('onmouseleave', 'invalidInputTooltip(this.id)');

        meshValue.classList.remove('is-valid');
        meshValue.classList.add('is-invalid');
        return ["smallMesh", submitButton];
    }

    let part = '';

    if ((actualForm.getAttribute('id').substr(-3, 3) == 'fir') || (actualForm.getAttribute('id').substr(-3, 3) == 'sec')) {
        part = actualForm.getAttribute('id').substr(-3, 3);
    }

    let inputsList = $(`[class*="form-control"][id*="${part}"]`);
    let invalid = 0;

    // zkontroluje, zda jsou všechny form-controly validní
    for (let j = 0; j < inputsList.length; j++) {
        if ((inputsList[j].getAttribute('class').includes('invalid')) || (inputsList[j].value == '')) {
            if (!/shift|merged_hole|rotate|mirror/.test(inputsList[j].id)) {
                invalid += 1;
            }
        }

        else {
            continue;
        }
    }

    // ve formuláři není ani jeden nevalidní form-control, zpřístupní se submit
    if (invalid == 0) {
        submitButton.classList.remove('disabledSubmit');
        submitButton.classList.add('enableSubmit');
        submitButton.removeAttribute('disabled');
    }

    else {
        submitButton.classList.add('disabledSubmit');
        submitButton.classList.remove('enableSubmit');
        submitButton.setAttribute('disabled', '');
    }

    return [null, submitButton];
}


function checkCanvasForm() {
    let meshNumber = $('#cnv_calculate_mesh_value')[0];
    let cnvForm = $('#cnv_form')[0];
    let errors = [];
    formInputValidation(meshNumber, cnvForm)[0] == null ? errors.push() : errors.push('badMesh');

    let coordX = $('#cnv_Xco')[0].value;
    let holeX = $('#cnv_Xho')[0].value;
    let holesActive = '';
    $('#holesButton')[0].getAttribute('active') == 'yes' ? holesActive = true : holesActive = false;

    coordX.split(',').length < 3 || coordX == '' ? errors.push('noGeom') : errors.push();

    if (((holesActive == true) || (holeX != '')) && (holeX.split(',').length < 3)) {
        errors.push('badHole');
    }

    let result = '';
    errors.length == 0 ? result = null : result = "error";

    return result;
}

function checkMergedSection() {
    let submitButton = $('#mrg_calculate')[0];
    let errors = [];

    let inputs = [$('#shift_x')[0], $('#shift_y')[0], $('#merged_hole_x')[0], $('#merged_hole_y')[0], $('[id*="rotate_fir"]')[0], $('[id*="rotate_sec"]')[0]];

    for (s = 0; s < inputs.length; s++) {

        if (!inputs[s]) {
            errors.push('error');
            break;
        }

        let oldErrors = errors.length;
        let actualFormGroup = inputs[s].parentNode;   // form group daného inputu
        let errorMessage = actualFormGroup.children[0];

        if (isNaN(inputs[s].value)) {      //--- input nevyplněný číslem ---//
            errorMessage.setAttribute('data-toggle', 'tooltip');
            errorMessage.setAttribute('data-placement', 'right');
            errorMessage.setAttribute('data-original-title', 'Zadejte prosím číselnou hodnotu.');
            errorMessage.setAttribute('onmouseenter', 'invalidInputTooltip(this.id)');
            errorMessage.setAttribute('onmouseleave', 'invalidInputTooltip(this.id)');
            errors.push("NaN");
        }

        else if (String(inputs[s].value) == "") {      //--- nevyplněný input ---//
            if (!/merged_hole|rotate/.test(inputs[s].id)) {
                errorMessage.setAttribute('data-toggle', 'tooltip');
                errorMessage.setAttribute('data-placement', 'right');
                errorMessage.setAttribute('data-original-title', 'Zadejte prosím hodnotu.');
                errorMessage.setAttribute('onmouseenter', 'invalidInputTooltip(this.id)');
                errorMessage.setAttribute('onmouseleave', 'invalidInputTooltip(this.id)');
                errors.push("empty");
            }

            else {           //--- vstupem je kladné číslo přijatelné velikosti ---//
                inputs[s].classList.remove('is-invalid');
                inputs[s].classList.add('is-valid');
                errorMessage.removeAttribute('data-toggle');
                errorMessage.removeAttribute('data-placement');
                errorMessage.removeAttribute('data-original-title');
                errorMessage.removeAttribute('onmouseenter');
                errorMessage.removeAttribute('onmouseleave');
            }
        }

        else if ((inputs[s].value.length > 6) || (inputs[s].value > 2500) || (inputs[s].value < -2500)) {           //--- nepřijme více než 6 znaků nebo rozměr větší než 5000
            errorMessage.setAttribute('data-toggle', 'tooltip');
            errorMessage.setAttribute('data-placement', 'right');
            errorMessage.setAttribute('data-original-title', 'Příliš velké číslo.');
            errorMessage.setAttribute('onmouseenter', 'invalidInputTooltip(this.id)');
            errorMessage.setAttribute('onmouseleave', 'invalidInputTooltip(this.id)');
            errors.push("big");
        }

        else if ((inputs[s].value < 0.1) && (parseFloat(inputs[s].value) > 0)) {         //--- nepřijme vstup menší než 0.1 ---//
            errorMessage.setAttribute('data-toggle', 'tooltip');
            errorMessage.setAttribute('data-placement', 'right');
            errorMessage.setAttribute('data-original-title', 'Příliš malé číslo.');
            errorMessage.setAttribute('onmouseenter', 'invalidInputTooltip(this.id)');
            errorMessage.setAttribute('onmouseleave', 'invalidInputTooltip(this.id)');
            errors.push("small");
        }

        let newErrors = errors.length;

        if (oldErrors != newErrors) {
            inputs[s].classList.remove('is-invalid');
            inputs[s].classList.remove('is-valid');
            inputs[s].classList.add('is-invalid');
        }

        else {           //--- vstupem je kladné číslo přijatelné velikosti ---//
            inputs[s].classList.remove('is-invalid');
            inputs[s].classList.add('is-valid');
            errorMessage.removeAttribute('data-toggle');
            errorMessage.removeAttribute('data-placement');
            errorMessage.removeAttribute('data-original-title');
            errorMessage.removeAttribute('onmouseenter');
            errorMessage.removeAttribute('onmouseleave');
        }
    }

    if (($('#first_cross_section')[0].children[0]) && ($('#second_cross_section')[0].children[0])) {
        if (($(':submit[id*="fir"]')[0].getAttribute('class').includes('disabledSubmit')) || ($(':submit[id*="sec"]')[0].getAttribute('class').includes('disabledSubmit'))) {
            errors.push('error');
        }
    }

    else {
        errors.push('error');
    }

    if (errors.length == 0) {
        if (window.location.href.includes('stresses')) {
            submitButton = $('#selectCreatorSection')[0];
        }

        submitButton.removeAttribute('disabled');
        submitButton.classList.remove('disabledSubmit');
        submitButton.classList.add('enableSubmit');
    }

    else {
        submitButton.setAttribute('disabled', '');
        submitButton.classList.remove('enableSubmit');
        submitButton.classList.add('disabledSubmit');
    }

    if (parseFloat($('#shift_x')[0].value) + parseFloat($('#shift_y')[0].value) == 0) {
        submitButton.setAttribute('disabled', '');
        submitButton.classList.remove('enableSubmit');
        submitButton.classList.add('disabledSubmit');

        alert('Druhý průřez není posunutý v žádné ose!');
    }

}


function invalidInputTooltip(input) {
    $(`#${input}`).tooltip();
}