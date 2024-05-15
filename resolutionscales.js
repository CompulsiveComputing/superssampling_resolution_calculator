"use strict";

// ascii generated at https://patorjk.com/software/taag/#p=display&f=ANSI%20Shadow
//  ██████╗██╗      █████╗ ███████╗███████╗███████╗███████╗
// ██╔════╝██║     ██╔══██╗██╔════╝██╔════╝██╔════╝██╔════╝
// ██║     ██║     ███████║███████╗███████╗█████╗  ███████╗
// ██║     ██║     ██╔══██║╚════██║╚════██║██╔══╝  ╚════██║
// ╚██████╗███████╗██║  ██║███████║███████║███████╗███████║
//  ╚═════╝╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚══════╝

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
    constructor(colloquialName, standardName, aspectRatio, dimensions) {
        this.colloquialName = colloquialName;  // "1080p"
        this.standardName = standardName;      // "Full HD (FHD)"
        this.aspectRatio = BigFractionDimensions.fromRatioNotation(aspectRatio);  // "16:9"
        this.dimensions = BigFractionDimensions.fromDimensionNotation(dimensions);  // "1920x1080"

        // Calculate actual aspect ratio from dimensions
        this.derivedAspectRatio = new BigFractionDimensions(
            this.dimensions.width,
            this.dimensions.height
        ).simplify();  // Simplifies the fraction to its lowest form
    }

    descaleResolution(multiplier) {
        if (multiplier instanceof ResolutionData) {
            return new ResolutionData(
                this.resolution.height.divideF(multiplier.height),
                this.resolution.width.divideF(multiplier.width)
            );
        } else if (multiplier instanceof BigFractionDimensions) {
            return new BigFractionDimensions(
                this.resolution.height.divideF(multiplier.height),
                this.resolution.width.divideF(multiplier.width)
            );
        } else if (multiplier instanceof BigFraction) {
            return this.resolution.descale(multiplier);
        } else {
            throw new Error("Unsupported type of multiplier");
        }
    }

    // Gets the resolution in 'width x height' format
    getResolutionDimension() {
        return this.dimensions.toDimensionNotation();
    }

    // Gets the nominal aspect ratio as a string
    getAspectRatio() {
        return this.aspectRatio.toRatioNotation();
    }

    // Gets the derived aspect ratio from actual dimensions
    getDerivedAspectRatio() {
        return this.derivedAspectRatio.toRatioNotation();
    }
}


// ██╗  ██╗███████╗██╗     ██████╗ ███████╗██████╗ 
// ██║  ██║██╔════╝██║     ██╔══██╗██╔════╝██╔══██╗
// ███████║█████╗  ██║     ██████╔╝█████╗  ██████╔╝
// ██╔══██║██╔══╝  ██║     ██╔═══╝ ██╔══╝  ██╔══██╗
// ██║  ██║███████╗███████╗██║     ███████╗██║  ██║
// ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝

function BindAlignDOM(){
    const bind = (elementName,value) => new DOMBinder(document.getElementById(elementName), value);

    alignToWidth = bind("alignToResWidth", alignToWidth);
    alignToheight = bind("alignToResHeight", alignToheight);
    alignToPixelCount = bind('alignToPixelCount', alignToPixelCount);
}

function toggleResolution(resolutionData, enabled = null) {
    const key = `${resolutionData.dimensions.toDimensionNotation()}`;
    if (activeResolutionData[key] && !enabled) {
        delete activeResolutionData[key];
    } else {
        activeResolutionData[key] = resolutionData;
    }
}

function getIntegralValue(elementId) {
    return parseInt(document.getElementById(elementId).value);
}


// ███████╗██╗  ██╗████████╗██████╗  █████╗     ██████╗  █████╗ ████████╗██╗ ██████╗ 
// ██╔════╝╚██╗██╔╝╚══██╔══╝██╔══██╗██╔══██╗    ██╔══██╗██╔══██╗╚══██╔══╝██║██╔═══██╗
// █████╗   ╚███╔╝    ██║   ██████╔╝███████║    ██████╔╝███████║   ██║   ██║██║   ██║
// ██╔══╝   ██╔██╗    ██║   ██╔══██╗██╔══██║    ██╔══██╗██╔══██║   ██║   ██║██║   ██║
// ███████╗██╔╝ ██╗   ██║   ██║  ██║██║  ██║    ██║  ██║██║  ██║   ██║   ██║╚██████╔╝
// ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ 
//Extra Ratio tab stuff follows

function populateExtraRatioScaleTable() {
    const tableBody = document.getElementById('ExtraRatioTable').getElementsByTagName('tbody')[0];

    const setActivePair = (pair) => {
        const xScale = new BigFraction(pair.xScale);
        const yScale = new BigFraction(pair.yScale);
        const equivalent = xScale.equal_toF(yScale);

        activeExtraRatioPair = { 
            xScale,
            yScale,
            equivalent
        };
    };

    initial_data.scalePairs.forEach((pair, index) => {

        
        const row = document.createElement('tr');
        
        const radioCell = document.createElement('td');
        const radioButton = document.createElement('input');
        radioButton.type = 'radio';
        radioButton.name = 'scalePair';
        radioButton.value = pair.name;
        radioButton.onclick = () => {
            setActivePair(pair);
            updateResolutions();
        };
        
        if (index === 0) {
            radioButton.checked = true;
            setActivePair(pair);
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

// ██████╗ ██╗   ██╗ █████╗ ██╗     ██╗████████╗██╗   ██╗    ███╗   ███╗ ██████╗ ██████╗ ███████╗███████╗
// ██╔═══██╗██║   ██║██╔══██╗██║     ██║╚══██╔══╝╚██╗ ██╔╝    ████╗ ████║██╔═══██╗██╔══██╗██╔════╝██╔════╝
// ██║   ██║██║   ██║███████║██║     ██║   ██║    ╚████╔╝     ██╔████╔██║██║   ██║██║  ██║█████╗  ███████╗
// ██║▄▄ ██║██║   ██║██╔══██║██║     ██║   ██║     ╚██╔╝      ██║╚██╔╝██║██║   ██║██║  ██║██╔══╝  ╚════██║
// ╚██████╔╝╚██████╔╝██║  ██║███████╗██║   ██║      ██║       ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗███████║
//  ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝   ╚═╝      ╚═╝       ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝
//Quality modes tab stuff follows

function populateQualityModeScaleTable() {
    const tableBody = document.getElementById('qualityTable').getElementsByTagName('tbody')[0];

    tableBody.innerHTML = "";

    Object.entries(initial_data.qualityMultipliers).forEach(([mode, multiplier]) => {
        const row = document.createElement('tr');

        const modeCell = document.createElement('td');
        modeCell.textContent = mode;
        row.appendChild(modeCell);

        const xScaleCell = document.createElement('td');
        xScaleCell.textContent = multiplier.width.to_string_float(1);
        row.appendChild(xScaleCell);

        const yScaleCell = document.createElement('td');
        yScaleCell.textContent = multiplier.height.to_string_float(1);
        row.appendChild(yScaleCell);

        const computedCell = document.createElement('td');
        computedCell.textContent = multiplier.getCount().to_string_float(1);;
        row.appendChild(computedCell);

        tableBody.appendChild(row);
    });
}

// ██████╗ ███████╗███████╗ ██████╗ ██╗     ██╗   ██╗████████╗██╗ ██████╗ ███╗   ██╗     ██████╗██╗  ██╗ ██████╗ ██╗ ██████╗███████╗
// ██╔══██╗██╔════╝██╔════╝██╔═══██╗██║     ██║   ██║╚══██╔══╝██║██╔═══██╗████╗  ██║    ██╔════╝██║  ██║██╔═══██╗██║██╔════╝██╔════╝
// ██████╔╝█████╗  ███████╗██║   ██║██║     ██║   ██║   ██║   ██║██║   ██║██╔██╗ ██║    ██║     ███████║██║   ██║██║██║     █████╗  
// ██╔══██╗██╔══╝  ╚════██║██║   ██║██║     ██║   ██║   ██║   ██║██║   ██║██║╚██╗██║    ██║     ██╔══██║██║   ██║██║██║     ██╔══╝  
// ██║  ██║███████╗███████║╚██████╔╝███████╗╚██████╔╝   ██║   ██║╚██████╔╝██║ ╚████║    ╚██████╗██║  ██║╚██████╔╝██║╚██████╗███████╗
// ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝    ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝     ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝ ╚═════╝╚══════╝
//Resolution Choice tab stuff follows

function populateGroupResolutionSwitchboard() {
    const getCategoryResolutionRange = (category) => {
        const group = initial_data.screen_db[category];
        const resolutions = group.map(res => res.dimensions.toDimensionNotation());
        return `${resolutions[0]} - ${resolutions[resolutions.length - 1]}`;
    }
    
    const getCategoryAspectRatioRange = (category) => {
        const group = initial_data.screen_db[category];
        const aspectRatios = new Set(group.map(res => res.aspectRatio.toRatioNotation()));
        return [...aspectRatios].join(', ');
    }

    const groupTableBody = document.getElementById('groupSwitchboardTable').getElementsByTagName('tbody')[0];
    groupTableBody.innerHTML = '';

    let enabledCategoryCount = 0;

    Object.keys(initial_data.screen_db).forEach((category, index) => {
        if (initial_data.screen_db[category].length > 0) {
            const row = groupTableBody.insertRow();
            const cell1 = row.insertCell(0);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';

            if (enabledCategoryCount < 2) {
                checkbox.checked = true;
                resolutionGroupsEnableStatus[category] = true;
                enabledCategoryCount++;
            } else {
                checkbox.checked = false;
                resolutionGroupsEnableStatus[category] = false;
            }

            checkbox.addEventListener('click', (e) => {
                resolutionGroupsEnableStatus[category] = !resolutionGroupsEnableStatus[category];
                Object.entries(initial_data.screen_db[category]).forEach(([key, resolution]) => {
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
        }
    });
}


function populateIndividualResolutionSwitchboard() {
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
            cell2.textContent = res.colloquialName;

            const cell21 = row.insertCell(2);
            cell21.textContent = res.standardName;
            
            const cell3 = row.insertCell(3);
            cell3.textContent = res.dimensions.toDimensionNotation();

            const cell4 = row.insertCell(4);
            cell4.textContent = res.aspectRatio.toRatioNotation();

            const cell5 = row.insertCell(5);
            cell5.textContent = res.getDerivedAspectRatio();
        });
    });
}

// ███████╗ ██████╗ █████╗ ██╗     ███████╗██████╗     ██████╗ ███████╗███████╗ ██████╗ ██╗     ██╗   ██╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
// ██╔════╝██╔════╝██╔══██╗██║     ██╔════╝██╔══██╗    ██╔══██╗██╔════╝██╔════╝██╔═══██╗██║     ██║   ██║╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
// ███████╗██║     ███████║██║     █████╗  ██║  ██║    ██████╔╝█████╗  ███████╗██║   ██║██║     ██║   ██║   ██║   ██║██║   ██║██╔██╗ ██║███████╗
// ╚════██║██║     ██╔══██║██║     ██╔══╝  ██║  ██║    ██╔══██╗██╔══╝  ╚════██║██║   ██║██║     ██║   ██║   ██║   ██║██║   ██║██║╚██╗██║╚════██║
// ███████║╚██████╗██║  ██║███████╗███████╗██████╔╝    ██║  ██║███████╗███████║╚██████╔╝███████╗╚██████╔╝   ██║   ██║╚██████╔╝██║ ╚████║███████║
// ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═════╝     ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝    ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
// Scaled Resolutions tab stuff follows

function calculateScreenQualityResolutions() {
    screenQualityResolutions = {};

    qualityMultipliers = {};

    maxResWidth = new BigFraction(0);
    maxResHeight = new BigFraction(0);

    Object.entries(initial_data.qualityMultipliers).forEach(([mode, multiplier]) => {
        const width = multiplier.width.multiplyF(activeExtraRatioPair.xScale);
        const height = multiplier.width.multiplyF(activeExtraRatioPair.yScale);
        const equivalent = width.equal_toF(height);
        const base_equivalent = multiplier.width.equal_toF(multiplier.height);
        const quality = {width, height, equivalent, base_width: multiplier.width, base_height: multiplier.height, base_equivalent};

        qualityMultipliers[mode] = quality;
    });

    Object.entries(activeResolutionData).forEach(([resKey, res]) => {
        const resScaling = {resolution:res};

        if (maxResWidth.less_thanF(res.dimensions.width)) {
            maxResWidth = new BigFraction(res.dimensions.width);
        }
        if (maxResHeight.less_thanF(res.dimensions.height)) {
            maxResHeight = new BigFraction(res.dimensions.height);
        }

        Object.entries(qualityMultipliers).forEach(([qualityName, quality]) => {
            const scaledX = res.dimensions.width.divideF(quality.width);
            const scaledY = res.dimensions.height.divideF(quality.height);
            const pixelCount = scaledX.multiplyF(scaledY);
            const isIntegral = scaledX.is_integral() && scaledY.is_integral();

            if (maxResWidth.less_thanF(scaledX)) {
                maxResWidth = new BigFraction(scaledX);
            }
            if (maxResHeight.less_thanF(scaledY)) {
                maxResHeight = new BigFraction(scaledY);
            }

            resScaling[qualityName] = {scaledX, scaledY, pixelCount, isIntegral};
        });
        screenQualityResolutions[resKey] = resScaling;
    });
}

function populateQualityTable() {
    calculateScreenQualityResolutions();
    
    const table = document.getElementById('resolutionTable');

    const caption = table.querySelector('#extra_ratio_caption');

    caption.textContent = (activeExtraRatioPair.equivalent && activeExtraRatioPair.xScale.is_one()) ? '' : `Extra Ratio [${activeExtraRatioPair.xScale.to_string_float(2)} : ${activeExtraRatioPair.yScale.to_string_float(2)}]`;

    const theadRow = table.querySelector('thead tr');
    theadRow.innerHTML = "<th>Resolution Names</th><th>Aspect Ratio</th><th>Base<span>( W x H )</span></th>";

    Object.entries(qualityMultipliers).forEach(([mode, multiplier]) => {
        const th = document.createElement('th');
        const ratioText = (multiplier.base_equivalent) ? `${multiplier.base_width.to_string_float(2)}` : `${multiplier.base_width.to_string_float(2)} : ${multiplier.base_height.to_string_float(2)}`; 
        th.innerHTML = `${mode} <span class="multiplier">${ratioText}</span>`;
        theadRow.appendChild(th);
    });
    
    
    const tableBody = table.getElementsByTagName('tbody')[0];
    tableBody.innerHTML = "";

    Object.entries(screenQualityResolutions).forEach(([resKey, res]) => {
        const row = document.createElement('tr');

        const resolution = res.resolution;

        resolution.element = row;

        const aspectRatio = resolution.aspectRatio.toRatioNotation();

        const rawDimensionsText = resolution.dimensions.toDimensionNotation();

        row.setAttribute(`data-dimensions`, rawDimensionsText);

        row.innerHTML = `<td>${resolution.standardName} ${resolution.colloquialName}</td><td>${aspectRatio}</td><td>${rawDimensionsText}</td>`;

        Object.entries(qualityMultipliers).forEach(([mode, multiplier]) => {
            const qualityRes = res[mode];
            const dimensionsText = `${qualityRes.scaledX.to_string_float(1)} x ${qualityRes.scaledY.to_string_float(1)}`;
            
            const formattedPixelCount = qualityRes.pixelCount.to_string_float(1);

            const cell = document.createElement('td');

            res[mode].element = cell;

            cell.setAttribute(`data-is_integral`, qualityRes.isIntegral);
            cell.setAttribute(`data-pixels-width`, qualityRes.scaledX.to_string_float(1));
            cell.setAttribute(`data-pixels-height`, qualityRes.scaledY.to_string_float(1));
            cell.setAttribute(`data-dimensions`, dimensionsText);
            cell.setAttribute(`data-pixels`, `${formattedPixelCount} px`);
            cell.classList.add('data-cell');

            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

// █████╗ ██╗     ██╗ ██████╗ ███╗   ██╗███████╗██████╗     ██████╗ ███████╗███████╗ ██████╗ ██╗     ██╗   ██╗████████╗██╗ ██████╗ ███╗   ██╗███████╗    
// ██╔══██╗██║     ██║██╔════╝ ████╗  ██║██╔════╝██╔══██╗    ██╔══██╗██╔════╝██╔════╝██╔═══██╗██║     ██║   ██║╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝    
// ███████║██║     ██║██║  ███╗██╔██╗ ██║█████╗  ██║  ██║    ██████╔╝█████╗  ███████╗██║   ██║██║     ██║   ██║   ██║   ██║██║   ██║██╔██╗ ██║███████╗    
// ██╔══██║██║     ██║██║   ██║██║╚██╗██║██╔══╝  ██║  ██║    ██╔══██╗██╔══╝  ╚════██║██║   ██║██║     ██║   ██║   ██║   ██║██║   ██║██║╚██╗██║╚════██║    
// ██║  ██║███████╗██║╚██████╔╝██║ ╚████║███████╗██████╔╝    ██║  ██║███████╗███████║╚██████╔╝███████╗╚██████╔╝   ██║   ██║╚██████╔╝██║ ╚████║███████║    
// ╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═════╝     ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝    ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
// Aligned Resolutions tab stuff follows


function calculateAlignedResolutions() {

    alignedResolutions = {};

    // Helper function to simplify and process aspect ratio and max resolution
    function processAspectRatioAndMaxResolution(aspectRatio, maxResolution) {
        const simplifiedAspectRatio = aspectRatio.simplify();

        // Calculate 12.5% above the maximum resolution dimensions

        const multi = new BigFraction("1.125");

        const extendedMaxResolution = new BigFractionDimensions(maxResolution.width.multiplyF(multi), maxResolution.height.multiplyF(multi));

        return { simplifiedAspectRatio, extendedMaxResolution };
    }

    // Helper function to get aligned resolutions
    function getAlignedResolutions(aspectRatio, maxResolution) {
        const alignmentResolution = new BigFractionDimensions(
            new BigFraction(alignToWidth.value),
            new BigFraction(alignToheight.value)
        );
        const alignmentPixelCount = new BigFraction(alignToPixelCount.value);

        return findValidResolutions(aspectRatio, maxResolution, alignmentResolution, alignmentPixelCount);
    }

    // Iterate over activeResolutionData to find aspect ratios and maximum resolutions
    Object.values(activeResolutionData).forEach(resolutionData => {
        const { derivedAspectRatio, dimensions } = resolutionData;
        const { simplifiedAspectRatio, extendedMaxResolution } = processAspectRatioAndMaxResolution(derivedAspectRatio, dimensions);

        // Calculate aligned resolutions
        const alignedResolutionsForAspectRatio = getAlignedResolutions(simplifiedAspectRatio, extendedMaxResolution);

        // Sort and store the aligned resolutions
        const aspectRatioKey = simplifiedAspectRatio.toRatioNotation();
        alignedResolutions[aspectRatioKey] = alignedResolutionsForAspectRatio.sort((a, b) => {
            const aPixelCount = a.width.multiplyF(a.height);
            const bPixelCount = b.width.multiplyF(b.height);
            return aPixelCount.compareF(bPixelCount);
        });
    });
}

function populateAlignedResolutions() {
    // Clear the existing table contents
    const tableHead = document.querySelector('#alignedResolutionsOutput thead tr');
    const tableBody = document.querySelector('#alignedResolutionsOutput tbody');
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    // Calculate aligned resolutions
    calculateAlignedResolutions();

    // Collect all unique widths and aspect ratios
    const uniqueWidths = new Set();
    const aspectRatios = Object.keys(alignedResolutions);
    
    aspectRatios.forEach(aspectRatio => {
        alignedResolutions[aspectRatio].forEach(resolution => {
            uniqueWidths.add(resolution.width.to_string_float(1));
        });
    });

    // Sort the unique widths
    const sortedWidths = Array.from(uniqueWidths).sort((a, b) => new BigFraction(a).greater_thanF(new BigFraction(b)));

    // Create the table headers for aspect ratios
    const widthHeader = document.createElement('th');
    widthHeader.textContent = 'Width';
    tableHead.appendChild(widthHeader);

    aspectRatios.forEach(aspectRatio => {
        const headerCell = document.createElement('th');
        headerCell.textContent = aspectRatio;
        tableHead.appendChild(headerCell);
    });

    // Populate the table rows with sorted widths and corresponding heights
    sortedWidths.forEach(width => {
        const row = document.createElement('tr');
        const widthCell = document.createElement('td');
        widthCell.textContent = width;
        row.appendChild(widthCell);

        aspectRatios.forEach(aspectRatio => {
            const heightCell = document.createElement('td');
            const resolution = alignedResolutions[aspectRatio].find(res => res.width.to_string_float(1) === width);
            if (resolution) {
                heightCell.textContent = resolution.height.to_string_float(1);
            } else {
                heightCell.textContent = '-';  // Or leave empty
            }
            row.appendChild(heightCell);
        });

        tableBody.appendChild(row);
    });
}



function populateNearestAlignedResolutions() {
    // Iterate over each resolution in the table to find the nearest aligned resolution
    Object.entries(screenQualityResolutions).forEach(([resKey, res]) => {
        const resolution = res.resolution;
        const aspectRatio = resolution.dimensions.simplify().toRatioNotation();
        const alignedResolutionsForAspectRatio = alignedResolutions[aspectRatio];

        if (!alignedResolutionsForAspectRatio) {
            return; // Skip if there are no aligned resolutions for this aspect ratio
        }


        Object.entries(qualityMultipliers).forEach(([mode, multiplier]) => {
            const quality = res[mode];

            const currentDimensions = new BigFractionDimensions(quality.scaledX, quality.scaledY);

            // Find the nearest aligned resolution
            const nearestAlignedResolution = findNearestAlignedResolution(currentDimensions, alignedResolutionsForAspectRatio);

            if(!nearestAlignedResolution)
                return;

            // Calculate alignment errors
            const alignmentErrorWidth = quality.scaledX.subtractF(nearestAlignedResolution.width).abs();
            const alignmentErrorHeight = quality.scaledY.subtractF(nearestAlignedResolution.height).abs();

            const nearestAlignedDimensions = `${nearestAlignedResolution.width.to_string_float()} x ${nearestAlignedResolution.height.to_string_float()}`;
            const alignmentErrorDimensions = `${alignmentErrorWidth.to_string_float(2)} x ${alignmentErrorHeight.to_string_float(2)}`;
            const alignmentErrorPixelCount = alignmentErrorWidth.multiplyF(alignmentErrorHeight).to_string_float(2) + ' px';

            quality.element.setAttribute('data-nearest-aligned-dimensions', nearestAlignedDimensions);
            quality.element.setAttribute('data-nearest-aligned-pixel-count', nearestAlignedResolution.width.multiplyF(nearestAlignedResolution.height).to_string_float() + ' px');
            quality.element.setAttribute('data-alignment-error-dimensions', alignmentErrorDimensions);
            quality.element.setAttribute('data-alignment-error-pixel-count', alignmentErrorPixelCount);

        });
    });

    // Helper function to find the nearest aligned resolution
    function findNearestAlignedResolution(targetResolution, alignedResolutions) {
        // Ensure the alignedResolutions array is sorted by their count
        alignedResolutions.sort((a, b) => a.getCount().compareF(b.getCount()));

        if(alignedResolutions.length == 0)
            return;
    
        let left = 0;
        let right = alignedResolutions.length - 1;
        let nearestResolution = alignedResolutions[0];
        let smallestDistance = distance(targetResolution, nearestResolution);
    
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const currentResolution = alignedResolutions[mid];
            const currentDistance = distance(targetResolution, currentResolution);
    
            if (currentDistance.less_thanF(smallestDistance)) {
                smallestDistance = currentDistance;
                nearestResolution = currentResolution;
            }
    
            if (currentResolution.getCount().less_thanF(targetResolution.getCount())) {
                left = mid + 1;
            } else if (currentResolution.getCount().greater_thanF(targetResolution.getCount())) {
                right = mid - 1;
            } else {
                break;
            }
        }
    
        // After binary search, check the nearest points around the mid point
        // to ensure the nearest resolution considering NearestChoices constraints
        if (nearestChoice === NearestChoices.TRUE) {
            for (let i = Math.max(0, left - 1); i <= Math.min(alignedResolutions.length - 1, right + 1); i++) {
                const alignedResolution = alignedResolutions[i];
                const currentDistance = distance(targetResolution, alignedResolution);
                if (currentDistance.less_or_equal_toF(smallestDistance)) {
                    smallestDistance = currentDistance;
                    nearestResolution = alignedResolution;
                }
            }
        } else if (nearestChoice === NearestChoices.BELOW) {
            for (let i = Math.max(0, left - 1); i <= Math.min(alignedResolutions.length - 1, right + 1); i++) {
                const alignedResolution = alignedResolutions[i];
                if (alignedResolution.getCount().less_or_equal_toF(targetResolution.getCount())) {
                    const currentDistance = distance(targetResolution, alignedResolution);
                    if (currentDistance.less_thanF(smallestDistance)) {
                        smallestDistance = currentDistance;
                        nearestResolution = alignedResolution;
                    }
                }
            }
        } else if (nearestChoice === NearestChoices.ABOVE) {
            for (let i = Math.max(0, left - 1); i <= Math.min(alignedResolutions.length - 1, right + 1); i++) {
                const alignedResolution = alignedResolutions[i];
                if (alignedResolution.getCount().greater_or_equal_toF(targetResolution.getCount())) {
                    const currentDistance = distance(targetResolution, alignedResolution);
                    if (currentDistance.less_thanF(smallestDistance)) {
                        smallestDistance = currentDistance;
                        nearestResolution = alignedResolution;
                    }
                }
            }
        }
    
        return nearestResolution;
    
        function distance(a, b) {
            return a.getCount().subtractF(b.getCount()).abs();
        }
    }
    
    
}

function findValidResolutions(aspectRatio, maxResolution, alignmentResolution, alignmentPixelCount) {
    const validResolutions = [];

    aspectRatio = aspectRatio.simplify();

    if (maxResolution.width.value <= 0 && maxResolution.height.value <= 0) {
        return validResolutions;
    }

    const widthScalingFactor = maxResolution.width.divideF(aspectRatio.width);
    const heightScalingFactor = maxResolution.height.divideF(aspectRatio.height);
    const maximumScalingFactor = BigFraction.min(widthScalingFactor, heightScalingFactor);

    const oneF = BigFraction.one();

    const minimumScalingFactor = new BigFraction(oneF);

    for (let scalingFactor = minimumScalingFactor; scalingFactor.less_or_equal_toF(maximumScalingFactor); scalingFactor = scalingFactor.addF(oneF)) {
        const currentWidth = aspectRatio.width.multiplyF(scalingFactor);
        const currentHeight = aspectRatio.height.multiplyF(scalingFactor);
        const pixelCount = currentWidth.multiplyF(currentHeight);

        if (!pixelCount.modF(alignmentPixelCount).is_zero()) {
            continue;
        }

        const currentResolution = new BigFractionDimensions(currentWidth, currentHeight);

        if (currentResolution.greater_thanBFD(maxResolution)) {
            continue;
        }

        if (currentResolution.isAligned(alignmentResolution)) {
            validResolutions.push(currentResolution);
        }
    }

    return validResolutions;
}
