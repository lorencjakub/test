// Vytvoření nového objektu - formulář průřezu, a jeho vložení na stránku.

class MergedCrossSection {

    constructor(clicked_id) {
        // pokud na stránce existuje div "results", smaže ho
        if ($('#results')[0]) {
            $('#results')[0].remove();
        }

        this.switcher = $(`#${clicked_id}`).prop('id');   // kliknutý switcher
        this.objectId = this.switcher.substr(0, 3);     // název typu průřezu
        this.selectedCard = $(`#${this.switcher}_card`)[0]; // div obsahující switcher a obrázek
        this.flexDiv = $("#selected_section_card")[0];  // div, do kterého se má vytvořit form
        this.values = $('#select_values')[0];     // input select_values

        this.createFinalForm();  // vytvoří finální formulář merged průřezu včetně jeho defaultního obsahu

        this.createContentOfHeader();   // přidá do divu průřezů všechny elementy

        let firstOne = document.createElement('div');   // vytvoří a přidá div pro formulář prvního průřezu
        firstOne.setAttribute('id', 'first_cross_section');
        firstOne.setAttribute('class', 'section_field collapse m-2');
        this.newCrossSectionForm.insertBefore(firstOne, $('#secondSectionShift')[0]);

        let secondOne = document.createElement('div');   // vytvoří a přidá div pro formulář druhého průřezu
        secondOne.setAttribute('id', 'second_cross_section');
        secondOne.setAttribute('class', 'section_field collapse m-2');
        this.newCrossSectionForm.insertBefore(secondOne, $('#secondSectionShift')[0]);

// ====== close button =====
        let cardElement = $('#selected_section_card')[0];
        let closeRow = createNewDiv(['row', 'justify-content-end'], false, '');
        cardElement.insertBefore(closeRow, cardElement.children[0]);;

        let closeButton = document.createElement('button');
        closeButton.setAttribute('type', 'button');
        closeButton.setAttribute('id', `${clicked_id}_close`);
        closeButton.setAttribute('class', 'close');
        closeButton.setAttribute('onclick', 'createNewCrossSection(this.id);');
        closeButton.setAttribute('aria-label', 'Close');
        closeRow.append(closeButton);

        let buttonSpan = createNewTextElement('span', '', true, closeButton);
        buttonSpan.setAttribute('aria-hidden', 'true');
        buttonSpan.innerHTML = '&times;'
// ====== konec close buttonu =====//

        let cardContent = $('#selected_section_card')[0].innerHTML;
        $('#selected_section_card')[0].innerHTML = '';
        let sectionCard = createNewDiv(['card', 'text-white', 'bg-dark', 'xs-10'], true, $('#selected_section_card')[0]);
        sectionCard.innerHTML = cardContent;

        if (!window.location.href.includes('stresses')) {
            $('#geometric_checkbox')[0].checked = true;
            $('#warping_checkbox')[0].checked = true;
            $('#plastic_checkbox')[0].checked = true;
        }
    }

    // metoda na přidání elementů do divu průřezu
    createContentOfHeader() {

// ====== část pro hlavičku formuláře =====

        //vytvoření divu hlavičky formuláře
        let formHeader = createNewDiv(['form-row', 'justify-content-center', 'headerPart', 'rounded'], false, '');
        formHeader.setAttribute('id', 'header_part');

        //vytvoření form-group hlavičky
        let headerGroup = createNewDiv(['form-row', 'justify-content-center', 'headerPart', 'rounded'], true, formHeader);
        headerGroup.setAttribute('id', this.objectId + '_headerPart');

        // vytvoření hlavičky - titulek průřezu: pokud se jedná o netypický průřez (L, T, kulatina, plech...), je pojmenování odlišné od objectId
        let headerOfForm = createNewTextElement('legend', 'Průřez: Složený', true, headerGroup);

        // vytvoření inputu s informací o typu průřezu - bude předán serveru
        let typeOfSection = createNewInput('hidden', '', 'dimension_type', '', '', '', '', this.objectId, 'form-control', true, headerGroup);

// ====== konec části pro hlavičku formuláře =====


// ====== část pro dílčí průřezy =====

        let partialSectionDiv = createNewDiv(['form-group'], false, '');

        // elementy týkající se prvního průřezu
        let firstLabelRow = createNewDiv(['form-row', 'm-2'], true, partialSectionDiv);
        let firstLabel = createNewTextElement('p', 'Vyber první průřez:', true, firstLabelRow);

        let firstCardsPlace = createNewDiv(['form-row', 'justify-content-start'], true, partialSectionDiv);
        let firstCrossSections = this.createCrossSectionCards('fir', firstCardsPlace); // vytvoří karty jednotlivých typů průřezů pro první průřez a vloží je do divu průřezů


        // elementy týkající se druhého průřezu
        let secondLabelRow = createNewDiv(['form-row', 'm-2'], true, partialSectionDiv);
        let secondLabel = createNewTextElement('p', 'Vyber druhý průřez:', true, secondLabelRow);

        let secondCardsPlace = createNewDiv(['form-row', 'justify-content-start'], true, partialSectionDiv);
        let secondCrossSections = this.createCrossSectionCards('sec', secondCardsPlace); // vytvoří karty jednotlivých typů průřezů pro druhý průřez a vloží je do divu průřezů


        // vložení elementů před zbytek zbytek elementů formuláře
        this.newCrossSectionForm.insertBefore(partialSectionDiv, this.newCrossSectionForm.children[0]);

// ====== konec části pro dílčí průřezy =====


        // vložení hlavičky na začátek formuláře
        this.newCrossSectionForm.insertBefore(formHeader, this.newCrossSectionForm.children[0]);

        /*Přidání inputu, do kterého se uloží json výsledky ze serveru, jakmile budou k dipozici. Po jejich
        obdržení a přidání výsledků na stránku bude hodnota tohoto inputu vymazána - tudíž bude možné poslat
        nový výpočet bez nutnosti aktualizace stránky. V případě zavření průřezu bude vymazán i tento input.*/
        let resultInput = createNewInput('hidden', 'json_result', 'json_result', '', '', '', '', '', '', true, this.flexDiv);
        resultInput.style.display = 'none';
    }

    // funkce na vytvoření karet průřezů, prvního nebo druhého (podle "part", fir je pro první, sec je pro druhý)
    createCrossSectionCards(part, cardsPlace) {
        let listOfCrossSections = ['IPE', 'HEB', 'UPE', 'L_s', 'T_s', 'RHS', 'CHS', 'crl', 'rtg'];
        cardsPlace.setAttribute('class', 'form-row justify-content-between mx-2');

        // pro každý průřez podle listOfCrossSections vytvoří obrázek a přiřadí mu event listenery na funkce pro ovládání merged průřezu
        for (let i = 0; i < listOfCrossSections.length; i++) {
            let imageColumn = createNewDiv(['col-3', 'my-1'], true, cardsPlace);

            let element = document.createElement('img');

            if (listOfCrossSections[i] == 'L_s') {
                element.setAttribute('src', './static/pictures/svg/L_section_pic.svg');
            }

            else if (listOfCrossSections[i] == 'T_s') {
                element.setAttribute('src', './static/pictures/svg/T_section_pic.svg');
            }

            else {
                element.setAttribute('src', `./static/pictures/svg/${listOfCrossSections[i]}_section_pic.svg`);
            }

            element.setAttribute('id', part + '_merged_bar_switch_button_' + listOfCrossSections[i]);
            element.setAttribute('style', 'border:1px solid #000000;');
            element.setAttribute('class', 'crossSectionIconSmall');

            if (part == 'fir') {
                element.setAttribute('onclick', 'showCrossSections(this.id); createNewCrossSection(this.id); editFinalForm(this.id); checkFormInputs(event);');
            }

            else {
                element.setAttribute('onclick', 'showCrossSections(this.id); createNewCrossSection(this.id); editFinalForm(this.id); checkFormInputs(event);');
            }

            imageColumn.appendChild(element);
        }
    }

    createFinalForm() {
        // vytvoření formuláře
        this.newCrossSectionForm = document.createElement('form');

        /*formuláři se přiřadí metoda get kvůli posílání dat do SSE a class pro průřezový formulář*/

        this.newCrossSectionForm.setAttribute('method', 'get');
        this.newCrossSectionForm.setAttribute('class', 'input_formular');
        this.newCrossSectionForm.setAttribute('id', this.objectId + '_form');
        this.newCrossSectionForm.setAttribute('onchange', 'checkFormInputs(event);');
        this.newCrossSectionForm.setAttribute('onsubmit', 'ajaxSubmit(event);');

// ====== část pro zadání posunu 2. dílčího průřezu =====

        let shiftDiv = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, this.newCrossSectionForm);
        shiftDiv.setAttribute('id', 'secondSectionShift');

        let shiftLabelDiv = createNewDiv(['col-12', 'col-md-5'], true, shiftDiv);
        let labelOfShift = createNewTextElement('label', 'Posunutí 2. průřezu:', true, shiftLabelDiv); // popisek inputů posunutí 2. průřezu

        let shiftXDiv = createNewDiv(['col-5', 'col-md-3', 'mx-2', 'my-1'], true, shiftDiv);
        let shiftXInput = createNewInput('text', 'shift_x', 'shift_x', 5, 1, 1, 2500, '', 'form-control', true, shiftXDiv); // posun X
        let shiftXSpan = createNewTextElement('span', '', true, shiftXDiv); // span pro záznam validace inputu pro posun X
        shiftXSpan.setAttribute('id', 'shift_x_check_valid');
        shiftXInput.setAttribute('placeholder', 'Osa X');

        let shiftYDiv = createNewDiv(['col-5', 'col-md-3', 'my-1'], true, shiftDiv);
        let shiftYInput = createNewInput('text', 'shift_y', 'shift_y', 5, 1, 1, 2500, '', 'form-control', true, shiftYDiv); // posun Y
        let shiftYSpan = createNewTextElement('span', '', true, shiftYDiv); // span pro záznam validace inputu pro posun Y
        shiftYSpan.setAttribute('id', 'shift_y_check_valid');
        shiftYInput.setAttribute('placeholder', 'Osa Y');

// ====== konec části pro zadání posunu 2. dílčího průřezu =====

// ====== část pro definici dutiny =====

        let holeDiv = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, this.newCrossSectionForm);
        holeDiv.setAttribute('id', 'sectionHole');

        let holeLabelDiv = createNewDiv(['col-12', 'col-md-5'], true, holeDiv);
        let labelOfHole = createNewTextElement('label', 'Bod v dutině průřezu:', true, holeLabelDiv); // popisek inputů posunutí 2. průřezu

        let holeXDiv = createNewDiv(['col-5', 'col-md-3', 'mx-2', 'my-1'], true, holeDiv);
        let holeXInput = createNewInput('text', 'merged_hole_x', 'merged_hole_x', 5, 1, 1, 2500, '', 'form-control', true, holeXDiv); // posun X
        let holeXSpan = createNewTextElement('span', '', true, holeXDiv); // span pro záznam validace inputu pro posun X
        holeXSpan.setAttribute('id', 'merged_hole_x_valid');
        holeXInput.setAttribute('placeholder', 'Osa X');

        let holeYDiv = createNewDiv(['col-5', 'col-md-3', 'my-1'], true, holeDiv);
        let holeYInput = createNewInput('text', 'merged_hole_y', 'merged_hole_y', 5, 1, 1, 2500, '', 'form-control', true, holeYDiv); // posun X
        let holeYSpan = createNewTextElement('span', '', true, holeYDiv); // span pro záznam validace inputu pro posun X
        holeYSpan.setAttribute('id', 'merged_hole_y_valid');
        holeYInput.setAttribute('placeholder', 'Osa Y');

        // calculate options
        if (!window.location.href.includes('stresses')) {
            createCalculateOptions(this.newCrossSectionForm);
        }

        //přidání submitu do formuláře a jeho defaultní deaktivace
        let submitOfMergedForm = createNewInput('submit', this.objectId + '_calculate', '', '', '', '', '', 'Výpočet', 'btn-block rounded disabledSubmit', true, this.newCrossSectionForm);   // submit formuláře merged průřezu
        submitOfMergedForm.setAttribute('disabled', '');

        this.flexDiv.appendChild(this.newCrossSectionForm);    // přidání formuláře do divu průřezů
// ====== konec části pro definici dutiny =====
    }
}