//--- MODUL OBSAHUJÍCÍ FUNKCE, KTERÉ OVLÁDAJÍ VOLBY NA PRŮŘEZECH ---//

function myFunc(clicked_id) {       //--- přepínání mezi svařovaným a válcovaným průřezem ---//
    let checkBox = document.getElementById(clicked_id);
    let sectionType = String(checkBox.parentElement.id).substr(0, 3);   // zjistí typ průřezu
    let rolledPartOfSection = document.getElementById(sectionType + "_welded_check_rolled");
    let weldedPartOfSection = document.getElementById(sectionType + "_welded_check_welded");
    let tryIfIsClone = String(checkBox.parentElement.id).substr(- 4, 4);    //zjistí konec ID prvku
    let weldedValue = document.getElementsByName('is_welded')[0];

    if ((tryIfIsClone == '_fir') || (tryIfIsClone == '_sec')) {     //upraví ID, pokud je průřez klon (tj. ID mu končí _fir nebo _sec)
        rolledPartOfSection = document.getElementById(String(rolledPartOfSection.id) + tryIfIsClone);
        weldedPartOfSection = document.getElementById(String(weldedPartOfSection.id) + tryIfIsClone);
    }

    // weldedPartOfSection.style.display = (checkBox.checked === true) ? 'block' : 'none';       // --- podle checku nebo unchecku zobrazuje inputy pro jednotlivé typy průřezů
    if (checkBox.checked === true) {
        weldedPartOfSection.style.display = 'block';
        rolledPartOfSection.style.display = 'none';
        weldedValue.value = 'yes';
    }

    else {
        rolledPartOfSection.style.display = 'block';
        weldedPartOfSection.style.display = 'none';
        weldedValue.value = 'no';
    }
}

function activeUneq(clicked_id) {       //--- výběr nerovnoramenného L- průřezu ---//
    let clickedCheckbox = document.getElementById(clicked_id);
    let containerOfCheckbox = String(clickedCheckbox.parentElement.id).substr(-4, 4);
    let location = '';

    if ((containerOfCheckbox == '_fir') || (containerOfCheckbox == '_sec')) {
        location = containerOfCheckbox;
    }

    document.getElementById('L_s_eq_active'+ location).checked = false;
    document.getElementById('L_s_uneq_active'+ location).checked = true;
    document.getElementById('L_s_uneq'+ location).style.display = 'block';
    document.getElementById('L_s_eq'+ location).style.display = 'none';
}

function activeEq(clicked_id) {      //--- výběr rovnoramenného L- průřezu ---//
    let clickedCheckbox = document.getElementById(clicked_id);
    let containerOfCheckbox = String(clickedCheckbox.parentElement.id).substr(-4, 4);
    let location = '';

    if ((containerOfCheckbox == '_fir') || (containerOfCheckbox == '_sec')) {
        location = containerOfCheckbox;
    }

    document.getElementById('L_s_eq_active' + location).checked = true;
    document.getElementById('L_s_uneq_active' + location).checked = false;
    document.getElementById('L_s_uneq' + location).style.display = 'none';
    document.getElementById('L_s_eq' + location).style.display = 'block';
}

function activeRHS(clicked_id) {       //--- výběr obdélníkového jeklu ---//
    let clickedCheckbox = document.getElementById(clicked_id);
    let containerOfCheckbox = String(clickedCheckbox.parentElement.id).substr(-4, 4);
    let location = '';

    if ((containerOfCheckbox == '_fir') || (containerOfCheckbox == '_sec')) {
        location = containerOfCheckbox;
    }

    document.getElementById('SHS_section_active' + location).checked = false;
    document.getElementById('RHS_section_active' + location).checked = true;
    document.getElementById('RHS_part' + location).style.display = 'block';
    document.getElementById('SHS_part' + location).style.display = 'none';
}

function activeSHS(clicked_id) {       //--- výběr čtvercového jeklu ---//
    let clickedCheckbox = document.getElementById(clicked_id);
    let containerOfCheckbox = String(clickedCheckbox.parentElement.id).substr(-4, 4);
    let location = '';

    if ((containerOfCheckbox == '_fir') || (containerOfCheckbox == '_sec')) {
        location = containerOfCheckbox;
    }

    document.getElementById('SHS_section_active' + location).checked = true;
    document.getElementById('RHS_section_active' + location).checked = false;
    document.getElementById('RHS_part' + location).style.display = 'none';
    document.getElementById('SHS_part' + location).style.display = 'block';
}