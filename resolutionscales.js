"use strict";
class DOMBinder {
    constructor(element, initialValue) {
        this._element = element;  // The DOM element itself
        this._value = Number(initialValue);  // Ensure the initial value is a number

        // Initialize the element with the initial value
        this._element.value = this._value;

        // Update the internal value whenever the input changes
        this._element.addEventListener('input', (e) => {
            this._value = Number(this._element.value);  // Convert input value to number
            console.dir(element, initialValue, e);
        });
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        const numValue = Number(newValue);  // Ensure newValue is a number
        if (this._value !== numValue) {
            this._value = numValue;
            this._element.value = numValue;  // Also update the DOM element
        }
    }
}


class ResolutionData {
    constructor(resolutionName, AlledgedAspectRatio, resolution) {
        this.resolutionName = resolutionName;

        this.alledgedAspectRatio = FractionalPair.fromRatioNotation(AlledgedAspectRatio);

        this.resolution = FractionalPair.fromDimensionNotation(resolution);

        this.aspectRatio = this.resolution.simplify();
    }

    descaleResolution(multiplier) {
        if (multiplier instanceof ResolutionData) {
            return new ResolutionData(
                this.resolution.height.multiply(multiplier.height),
                this.resolution.width.multiply(multiplier.width)
            );
        } else if (multiplier instanceof FractionalPair) {
            return new FractionalPair(
                this.resolution.height.divide(multiplier.height),
                this.resolution.width.divide(multiplier.width)
            );
        } else if (multiplier instanceof BigFraction) {
            return this.resolution.descale(multiplier);
        } else {
            throw new Error("Unsupported type of multiplier");
        }
    }

    getResolutionDimension() {
        return this.resolution.toDimensionNotation();
    }

    getAspectRatio() {
        return this.aspectRatio.toRatioNotation();
    }

    getDerivedAspectRatio() {
        return this.derivedAspectRatio.toRatioNotation();
    }
}

function BindAlignDOM(){
    const bind = (elementName,value) => new DOMBinder(document.getElementById(elementName), value);

    alignToWidth = bind("alignToResWidth", alignToWidth);
    alignToheight = bind("alignToResHeight", alignToheight);
    alignToPixelCount = bind('alignToPixelCount', alignToPixelCount);
}

function populateGroupResolutionSwitchboard() {
    //console.log(`${arguments.callee.name}:Begin`);
    const groupTableBody = document.getElementById('groupSwitchboardTable').getElementsByTagName('tbody')[0];

    function getCategoryResolutionRange(category) {
        const resolutions = initial_data.screen_db[category].map(res => res.resolution.toDimensionNotation());
        return `${resolutions[0]} - ${resolutions[resolutions.length - 1]}`;
    }

    // Utility function to get aspect ratio range for a category
    function getCategoryAspectRatioRange(category) {
        const aspectRatios = new Set(initial_data.screen_db[category].map(res => res.aspectRatio.toRatioNotation()));
        return [...aspectRatios].join(', ');
    }

    // Clear existing rows
    groupTableBody.innerHTML = '';

    // Populate the grouped resolutions table
    Object.keys(initial_data.screen_db).forEach(category => {
        console.log(category);
        if(initial_data.screen_db[category].length > 0) {
            const row = groupTableBody.insertRow();
            const cell1 = row.insertCell(0);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            // Add an event listener to toggle all resolutions within this category
            checkbox.addEventListener('click', (e) => {
                console.log(e);
                resolutionGroupsEnableStatus[category] = !resolutionGroupsEnableStatus[category];
                Object.entries(initial_data.screen_db[category]).forEach(([key,resolution])=>{
                    toggleResolution(resolution);
                });
                updateResolutions();
            });
            cell1.appendChild(checkbox);

            const cell2 = row.insertCell(1);
            cell2.textContent = category;

            const cell3 = row.insertCell(2);
            cell3.textContent = getCategoryResolutionRange(category);

            const cell4 = row.insertCell(3);
            cell4.textContent = getCategoryAspectRatioRange(category);

            resolutionGroupsEnableStatus[category] = true;
        }
    });
    }

    function populateIndividualResolutionSwitchboard() {
    console.log(`${arguments.callee.name}:Begin`);
    const tableBody = document.getElementById('individualSwitchboardTable').getElementsByTagName('tbody')[0];

    tableBody.innerHTML = "";

    Object.keys(initial_data.screen_db).forEach(category => {

        if(resolutionGroupsEnableStatus[category] === false){
            return;
        }

        initial_data.screen_db[category].forEach(res => {
            toggleResolution(res, true);

            const row = tableBody.insertRow();
            const cell1 = row.insertCell(0);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.addEventListener('click', () => toggleResolution(res));
            cell1.appendChild(checkbox);

            const cell2 = row.insertCell(1);
            cell2.textContent = res.resolutionName;

            const cell3 = row.insertCell(2);
            cell3.textContent = res.resolution.toDimensionNotation();

            const cell4 = row.insertCell(3);
            cell4.textContent = res.aspectRatio.toRatioNotation();
        });
    });
}

function toggleResolution(resolutionData, enabled = null) {
    const key = `${resolutionData.resolution.toDimensionNotation()}`;
    if (activeResolutionData[key] && !enabled) {
        // console.log("deleting", resolutionData);
        delete activeResolutionData[key];
    } else {
        // console.log("seting", resolutionData, activeResolutionData);
        activeResolutionData[key] = resolutionData;
    }
    //console.log(activeResolutionData, resolutionData);
}

function calculateAlignedDerivedResolutions() {
    // Object to store resolutions grouped by aspect ratio
    const resolutionsByRatio = {};

    // Loop through each screen type and categorize resolutions by aspect ratio
    Object.values(initial_data.screen_db).forEach(screenType => {
        screenType.forEach(resData => {
            const ratioKey = resData.aspectRatio.toRatioNotation();
            if (!resolutionsByRatio[ratioKey]) {
                resolutionsByRatio[ratioKey] = [];
            }
            resolutionsByRatio[ratioKey].push(resData.resolution);
        });
    });

    // Object to store maximum resolutions by aspect ratio
    const maxResolutionsByRatio = {};

    // Find the maximum resolution for each aspect ratio
    Object.keys(resolutionsByRatio).forEach(ratio => {
        maxResolutionsByRatio[ratio] = resolutionsByRatio[ratio].reduce((max, current) => {
            return (max.width * max.height > current.width * current.height) ? max : current;
        });
    });

    // Apply the calculation for aligned derived resolutions
    alignedDerivedResolutions = {};
    Object.keys(maxResolutionsByRatio).forEach(ratio => {
        const maxResolution = maxResolutionsByRatio[ratio];
        const alignWidth = getIntegralValue("alignToResWidth");
        const alignHeight = getIntegralValue("alignToResHeight");
        const alignPixelCount = getIntegralValue("alignToPixelCount");

        // Calculate aligned resolutions up to the max for each aspect ratio
        alignedDerivedResolutions[ratio] = findResolutions(
            new FractionalPair(maxResolution.width, maxResolution.height),
            new FractionalPair(maxResolution.width, maxResolution.height),
            new FractionalPair(alignWidth, alignHeight),
            alignPixelCount
        );
    });

    console.log(alignedDerivedResolutions); // Log or display as needed
}


function calculateDerivedResolutions() {
    // Initialize the main structure with each scale pair as the top-level key
    screenDerivedResolutions = Object.entries(initial_data.qualityMultipliers).map(([qualityName, qualityMultiplier]) => {
        // For each quality multiplier, create a nested structure for each screen type
        const screenTypeResults = {};

        // Loop through each screen type in the screen database
        for (const screenType in initial_data.screen_db) {
            // Initialize an array for this particular screen type under this quality multiplier
            screenTypeResults[screenType] = initial_data.screen_db[screenType].map(resolutionData => {
                // Calculate the descaled resolution
                const descaledResolution = resolutionData.resolution
                    .descale(activeExtraRatioPair.xScale)
                    .descale(activeExtraRatioPair.yScale)
                    .descale(qualityMultiplier.width)
                    .descale(qualityMultiplier.height);

                // Return the new FloatishPair with descaled values for this resolution
                return new FractionalPair(
                    descaledResolution.width.toString(),
                    descaledResolution.height.toString()
                );
            });
        }

        return {
            qualityName: qualityName,
            screenTypeResults: screenTypeResults
        };
    });

    console.log(screenDerivedResolutions); // Optionally log the results for verification
}

function populateExtraRatioScaleTable() {
    //console.log(`${arguments.callee.name}:Begin`);
    const tableBody = document.getElementById('ExtraRatioTable').getElementsByTagName('tbody')[0];

    initial_data.scalePairs.forEach((pair, index) => {

        
        const row = document.createElement('tr');
        
        const radioCell = document.createElement('td');
        const radioButton = document.createElement('input');
        radioButton.type = 'radio';
        radioButton.name = 'scalePair';
        radioButton.value = pair.name;
        radioButton.onclick = () => setActivePair(pair);
        if (index === 0) {
            radioButton.checked = true;
            setActivePair(pair); // Also set the first pair as the active pair on load
        }
        radioCell.appendChild(radioButton);
        row.appendChild(radioCell);

        const nameCell = document.createElement('td');
        nameCell.textContent = pair.name;
        row.appendChild(nameCell);

        const xScaleCell = document.createElement('td');
        xScaleCell.textContent = pair.xScale;
        row.appendChild(xScaleCell);

        const yScaleCell = document.createElement('td');
        yScaleCell.textContent = pair.yScale;
        row.appendChild(yScaleCell);

        const totalScaleCell = document.createElement('td');
        totalScaleCell.textContent = (pair.xScale * pair.yScale).toFixed(2);
        row.appendChild(totalScaleCell);

        tableBody.appendChild(row);
    });
}

function setActivePair(pair) {
    //console.log(`${arguments.callee.name}:Begin`);
    activeExtraRatioPair = pair;
    console.log('Active pair set to:', activeExtraRatioPair);
}

function populateQualityTable() {
    //console.log(`${arguments.callee.name}:Begin`);
    const theadRow = document.querySelector('#resolutionTable thead tr');
    theadRow.innerHTML = "<th>Resolution Name</th><th>Aspect Ratio</th>";

    Object.entries(initial_data.qualityMultipliers).forEach(([mode, multiplier]) => {
        const th = document.createElement('th');
        const equal = (multiplier.width == multiplier.height);
        const ratioText = (multiplier.width.is_equal(multiplier.height)) ? `${multiplier.width}` : `${multiplier.width}: ${multiplier.height}`; 
        th.innerHTML = `${mode} <span class="multiplier">${ratioText}</span>`;
        theadRow.appendChild(th);
    });


    const tableBody = document.getElementById('resolutionTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = "";

    Object.entries(activeResolutionData).forEach(([resKey, res]) => {
        const row = document.createElement('tr');

        const aspectRatio = `${res.aspectRatio.width}:${res.aspectRatio.height}`;

        row.innerHTML = `<td>${res.resolutionName}</td><td>${aspectRatio}</td>`;

        Object.entries(initial_data.qualityMultipliers).forEach(([mode, multiplier]) => {
            const scaleX = res.resolution.width.divide(multiplier.width);
            const scaleY = res.resolution.height.divide(multiplier.height);
            //const scaled = res.descaleResolution(multiplier);
            const dimensionsText = `${scaleX}x${scaleY}`;

            const pixelCount = scaleX * scaleY;
            
            const formattedPixelCount = pixelCount.toLocaleString();

            const cell = document.createElement('td');

            cell.setAttribute(`data-pixels-width`, scaleX);
            cell.setAttribute(`data-pixels-height`, scaleY);
            cell.setAttribute(`data-dimensions`, dimensionsText);
            cell.setAttribute(`data-pixels`, `${formattedPixelCount} px`);
            cell.classList.add('data-cell');

            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

function populateQualityModeScaleTable() {
    console.log(`${arguments.callee.name}:Begin`);
    const tableBody = document.getElementById('qualityTable').getElementsByTagName('tbody')[0];

    tableBody.innerHTML = "";

    Object.entries(initial_data.qualityMultipliers).forEach(([mode, multiplier]) => {
        const row = document.createElement('tr');

        const modeCell = document.createElement('td');
        modeCell.textContent = mode;
        row.appendChild(modeCell);

        const xScaleCell = document.createElement('td');
        xScaleCell.textContent = multiplier.width;
        //xScaleCell.contentEditable = true; // Allow editing directly in the cell
        row.appendChild(xScaleCell);

        const yScaleCell = document.createElement('td');
        yScaleCell.textContent = multiplier.height;
        //yScaleCell.contentEditable = true; // Allow editing directly in the cell
        row.appendChild(yScaleCell);

        const computedCell = document.createElement('td');
        computedCell.textContent = multiplier.width * multiplier.height;
        row.appendChild(computedCell);

        tableBody.appendChild(row);
    });
}




function initializeAspectRatiosMap() {
    console.log(`${arguments.callee.name}:Begin`);
    const theadRow = document.querySelector('#alignedResolutionsOutput thead tr');
    const aspectRatioMap = {};
    Array.from(theadRow.cells).forEach((cell, index) => {
        aspectRatioMap[cell.textContent.trim()] = index;
    });
    return aspectRatioMap;
}

function populateNearestAlignedResolutions() {
    console.log(`${arguments.callee.name}:Begin`);
    const resolutionTable = document.getElementById('resolutionTable');
    const alignedResolutionsTable = document.getElementById('alignedResolutionsOutput');
    const scaledCells = resolutionTable.querySelectorAll('.data-cell');
    const aspectRatioMap = initializeAspectRatiosMap();

    scaledCells.forEach((cell) => {
        const scaledWidth = parseInt(cell.getAttribute('data-pixels-width'));
        const scaledHeight = parseInt(cell.getAttribute('data-pixels-height'));
        const aspectRatio = cell.parentNode.cells[2].textContent.trim(); // Get aspect ratio from the third column of the resolution table
        const aspectRatioColumnIndex = aspectRatioMap[aspectRatio]; // Get the correct column index for this aspect ratio
        let nearestAlignedResolution = null;
        let minDimensionDifference = Infinity;
        let minPixelDifference = Infinity;

        Array.from(alignedResolutionsTable.querySelectorAll('tbody tr')).forEach((row) => {
            if (row.cells[aspectRatioColumnIndex] && row.cells[aspectRatioColumnIndex].textContent.includes('x')) {
                const [alignedWidth, alignedHeight] = row.cells[aspectRatioColumnIndex].textContent.split('x').map(Number);
                const alignedPixelCount = alignedWidth * alignedHeight;

                const dimensionDifference = Math.sqrt(
                    Math.pow(scaledWidth - alignedWidth, 2) + Math.pow(scaledHeight - alignedHeight, 2)
                );
                const pixelDifference = Math.abs(scaledWidth * scaledHeight - alignedPixelCount);

                if (dimensionDifference < minDimensionDifference || 
                    (dimensionDifference === minDimensionDifference && pixelDifference < minPixelDifference)) {
                    minDimensionDifference = dimensionDifference;
                    minPixelDifference = pixelDifference;
                    nearestAlignedResolution = { width: alignedWidth, height: alignedHeight, pixelCount: alignedPixelCount };
                }
            }
        });

        if (nearestAlignedResolution) {
            const nearestAlignedDimensions = `${nearestAlignedResolution.width}x${nearestAlignedResolution.height}`;
            const alignmentErrorWidth = Math.abs(nearestAlignedResolution.width - scaledWidth);
            const alignmentErrorHeight = Math.abs(nearestAlignedResolution.height - scaledHeight);

            cell.setAttribute('data-nearest-aligned-dimensions', nearestAlignedDimensions);
            cell.setAttribute('data-nearest-aligned-pixel-count', nearestAlignedResolution.pixelCount.toLocaleString() + ' px');
            cell.setAttribute('data-alignment-error-dimensions', `${alignmentErrorWidth}x${alignmentErrorHeight}`);
            cell.setAttribute('data-alignment-error-pixel-count', (alignmentErrorWidth * alignmentErrorHeight).toLocaleString() + ' px');
        }
    });
}

function getIntegralValue(elementId) {
    return parseInt(document.getElementById(elementId).value);
}

function populateAlignedResolutions() {
    console.log(`${arguments.callee.name}:Begin`);
    // const maxResWidth = getIntegralValue("maxResWidth");
    // const maxResHeight = getIntegralValue("maxResHeight");

    let maxResWidth = 0;
    let maxResHeight = 0;
    Object.entries(activeResolutionData).forEach(([inKey, item])=> {
        if (maxResWidth < item.width) {
            maxResWidth < item.width;
        }
        if (maxResHeight < item.height) {
            maxResHeight < item.height;
        }
    });

    const alignToResWidth = getIntegralValue("alignToResWidth");
    const alignToResHeight = getIntegralValue("alignToResHeight");

    const alignToPixelCount = getIntegralValue('alignToPixelCount');

    const maxRes = new FractionalPair(maxResWidth, maxResHeight);
    const alignToRes = new FractionalPair(alignToResWidth, alignToResHeight);

    const aspectRatiosDimensions = {};

    Object.entries(activeResolutionData).forEach(([inKey, item])=>{
        const key = `${item.aspectRatio.width}:${item.aspectRatio.height}`;
        if (!aspectRatiosDimensions[key]) {
            const scaleFactor = maxRes.largestScaleFactor(item.aspectRatio);
            const scaled = item.aspectRatio.scale(scaleFactor)
            aspectRatiosDimensions[key] = {aspectRatio: item.aspectRatio, maxRes: scaled};
        }
    });

    console.dir(aspectRatiosDimensions);

    // calculated aligned resolutions for each aspect ratio, up to their respective maxes

    const aggregatedResolutions = [];

    Object.entries(aspectRatiosDimensions).forEach(([key, data]) => {
        const reses = findResolutions(data.aspectRatio, maxRes, alignToRes, alignToPixelCount);

        console.dir({"data.aspectRatio":data.aspectRatio, maxRes, alignToRes, alignToPixelCount, reses});
        
        // sort by pixel count, so we can prune easily
        reses.sort((a, b) => (a.width * a.height) - (b.width * b.height));
        
        let uniqueResolutions = [reses[0]]; // Initialize with the first element
        
        for (let i = 1; i < reses.length; i++) {
            // Compare current resolution with the previous one
            if (reses[i].width !== reses[i - 1].width ||
            reses[i].height !== reses[i - 1].height) {
                // If it's different, add it to uniqueResolutions
                uniqueResolutions.push(reses[i]);
            }
        }
        
        aggregatedResolutions.concat(uniqueResolutions);

        data["alignedResolutions"] = uniqueResolutions;
    });

    console.dir(aggregatedResolutions);

    if(aspectRatiosDimensions.length == 0) return;

    const orderedResolutions = [];

    Object.entries(aspectRatiosDimensions).forEach(([key, aspectRatio]) => {
        Object.entries(aspectRatio.alignedResolutions).forEach(([key, resolution]) => {
            if(resolution)
                orderedResolutions.push({aspectRatio: aspectRatio.aspectRatio, resolution: resolution, pixelCount: resolution.width * resolution.height});
        });
    });

    orderedResolutions.sort((a, b) => a.resolution.width - b.resolution.width);

    const thead = document.querySelector('#alignedResolutionsOutput thead tr');
    thead.innerHTML = '<th>Width</th>';
    Object.keys(aspectRatiosDimensions).forEach(ratio => {
        const th = document.createElement('th');
        th.textContent = ratio;
        thead.appendChild(th);
    });

    const tbody = document.querySelector('#alignedResolutionsOutput tbody');
    tbody.innerHTML = '';

    const widthMap = {};
    orderedResolutions.forEach(item => {
        const width = item.resolution.width;
        const aspectRatio = `${item.aspectRatio.width}:${item.aspectRatio.height}`;
        if (!widthMap[width]) {
            widthMap[width] = {};
        }
        widthMap[width][aspectRatio] = `${item.resolution.width}x${item.resolution.height}`;
    });


    Object.keys(widthMap).sort((a, b) => parseInt(a) - parseInt(b)).forEach(width => {
        const row = document.createElement('tr');
        const widthCell = document.createElement('td');
        widthCell.textContent = width;
        row.appendChild(widthCell);

        Object.keys(aspectRatiosDimensions).forEach(ratio => {
            const cell = document.createElement('td');
            cell.textContent = widthMap[width][ratio] || '-';
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
    }

    function findResolutions(aspectRatio, maxRes, alignToRes, alignToCount) {
    console.log(`${arguments.callee.name}:Begin`);
    const resolutions = [];

    // Simplify the aspect ratio first to ensure consistency
    aspectRatio = aspectRatio.simplify();

    // Ensure that at least one of maxRes's dimensions is greater than 0.
    if (maxRes.width.value <= 0 && maxRes.height.value <= 0) {
        return resolutions;
    }

    // Calculate the minimum and maximum factors to multiply the aspect ratio by.
    const factorWidth = maxRes.width / aspectRatio.width;
    const factorHeight = maxRes.height / aspectRatio.height;
    const maxFactor = Math.floor(Math.min(factorWidth, factorHeight));

    const minFactor = 1;

    // Generate resolutions.
    for (let factor = minFactor; factor <= maxFactor; factor++) {
        const width = aspectRatio.width * factor;
        const height = aspectRatio.height * factor;
        const pixelCount = width * height;

        // Check if the pixel count is a multiple of alignToCount.
        if (pixelCount % alignToCount !== 0) {
            continue;  // Only continue if it's a multiple, otherwise skip this factor.
        }

        const resolution = new FractionalPair(width, height);

        // Check if resolution is out of bounds.
        if (resolution.exceeds(maxRes)) {
            continue;  // Stop if the resolution exceeds the maximum allowed resolution.
        }

        // Check if resolution is aligned.
        if (resolution.isAligned(alignToRes)) {
            resolutions.push(resolution);
        }
    }
    console.log(`${arguments.callee.name}:End`, {resolutions});
    return resolutions;
}