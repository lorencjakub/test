
class PdfStructure {

    constructor(resultElements, resultKeys) {
        this.resultElements = resultElements;
        this.pdfStructure = createNewDiv(['justify-content-center', 'html2pdf__page-break'], false, '');

        let dimensionType = this.resultElements['resultsHeader'].children[0].innerText.replace('Průřez: ', '');
        let dimensionValue = this.resultElements['resultsHeader'].children[1].innerText.replace('Dimenze průřezu: ', '');
        let filename = `${dimensionType}_${dimensionValue}.pdf`.replace('/', '_');

        this.resultElements['resultsHeader'].children[0].setAttribute('style', 'color: #000000');
        this.resultElements['resultsHeader'].children[0].innerText += ' - ' + this.resultElements['resultsHeader'].children[1].innerText.split(': ')[1];
        this.resultElements['resultsHeader'].removeChild(this.resultElements['resultsHeader'].children[1]);

        this.pdfStructure.append(this.resultElements['resultsHeader']);
        let tables = Object.keys(this.resultElements);

        for (let m = 0; m < tables.length - 1; m++) {
            if ($(`#${tables[m]}`)[0].children[0].tagName != 'IMG') {
                let tableHeader = document.createElement('thead');
                tableHeader.setAttribute('class', 'thead-light text-center');
                let headerRow = document.createElement('tr');
                headerRow.innerHTML = $(`#${tables[m]}`)[0].parentElement.children[0].innerText;
                tableHeader.append(headerRow);

                let partsRow = createNewDiv(['row', 'justify-content-center'], true, this.pdfStructure);
                let tableDiv = $(`#${tables[m]}`)[0].parentElement.children[1].cloneNode(true);
                tableDiv.classList.remove('collapse');

                partsRow.append(tableDiv);
                tableDiv.children[0].insertBefore(tableHeader, tableDiv.children[0].children[0]);
                tableDiv.children[0].setAttribute('class', 'table table-striped table-bordered table-sm');


                //tableDiv.children[0].children[1]    - tbody
                let tableRows = tableDiv.children[0].children[1].children;
                for (let n = 0; n < tableRows.length; n++) {
                    tableRows[n].children[0].setAttribute('style', 'color: #000000');
                    tableRows[n].children[1].setAttribute('style', 'color: #000000');
                    tableRows[n].children[2].setAttribute('style', 'color: #000000');
                }
            }

            else {
                let partsRow = createNewDiv(['row', 'justify-content-center'], true, this.pdfStructure);
                let blockName = $(`#${tables[m]}`)[0].parentElement.children[0].innerText;
                let pictureDiv = $(`#${tables[m]}`)[0].parentElement.children[1].cloneNode(true);
                pictureDiv.classList.remove('collapse');
                let oldImageSource = pictureDiv.children[0].getAttribute('src');

                if (!window.location.href.includes('stresses')) {
                    let pictureTitle = createNewTextElement('h3', blockName, true, partsRow);
                    pictureTitle.setAttribute('style', 'color: #000000');
                    pictureDiv.children[0].setAttribute('src', `${oldImageSource.replace('.png', 'PDF.png')}`);
                }

                partsRow.append(pictureDiv);
            }
        }

        // console.log(this.pdfStructure);

        // check existing result tables
        let breakpointElement = [];

        if (($('#elasticCgAxisTable')[0] != undefined) && ($('#plasticTable')[0] != undefined) && ($('#torsionalAndWarpingTable')[0] != undefined)) {
            breakpointElement.push('#elasticMainAxisTable');
            breakpointElement.push('#torsionalAndWarpingTable');
        }

        else if (($('#plasticTable')[0] != undefined) && ($('#torsionalAndWarpingTable')[0] != undefined)) {
            breakpointElement.push('#torsionalAndWarpingTable');
        }

        else if ($('#elasticCgAxisTable')[0] != undefined) {
            breakpointElement.push('#elasticMainAxisTable');
        }

        else if (window.location.href.includes('section_stresses')) {
            let resultPictures = $('.section_properties');

            for (let p = 1; p < resultPictures.length; p+=2) {
                breakpointElement.push(`#${resultPictures[p].getAttribute('id')}`);
            }
        }

        let options = {
            margin: 10,
            filename: `${dimensionType}_${dimensionValue}.pdf`,
            pagebreak: { after: breakpointElement }
        };

        html2pdf().set(options).from(this.pdfStructure).save();
    }
}