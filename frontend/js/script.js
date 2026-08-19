const $ = id => document.getElementById(id);

const file = $('file');
const drop = $('drop');
const preview = $('preview');
const media = $('media');
const filename = $('filename');
const state = $('state');
const analyze = $('analyze');

let selected = null;


// =====================================================
// DEMO RESULT
// Used only when the page first loads.
// =====================================================

const demo = {
    condition: 'wet',
    confidence: 0.91,
    trend: 'worsening',
    recommendation: 'Consider tire change soon',
    recommendationText:
        'Track conditions are trending wetter. The visual model indicates a meaningful shift toward wet conditions.',

    frames: [
        ['00:00', 'dry', 0.94],
        ['00:02', 'dry', 0.92],
        ['00:04', 'dry', 0.91],
        ['00:06', 'damp', 0.82],
        ['00:08', 'damp', 0.86],
        ['00:10', 'damp', 0.88],
        ['00:12', 'wet', 0.89],
        ['00:14', 'wet', 0.91],
        ['00:16', 'wet', 0.93],
        ['00:18', 'wet', 0.92],
        ['00:20', 'wet', 0.91],
        ['00:22', 'wet', 0.90]
    ]
};


// =====================================================
// CONDITION INFORMATION
// =====================================================

const info = {

    dry: [
        'DRY',
        '☀',
        'Track surface is likely dry'
    ],

    damp: [
        'DAMP',
        '◒',
        'Moisture detected on the surface'
    ],

    wet: [
        'WET',
        '🌧',
        'Track surface is likely wet'
    ],

    drying: [
        'DRYING',
        '◔',
        'Track is transitioning toward dry'
    ]

};


// =====================================================
// STATUS
// =====================================================

function stateText(text, busy = false) {

    state.textContent = text;

    const dot = $('stateDot');

    if (dot) {

        dot.style.background = busy
            ? '#ffd166'
            : '#43e59a';

        dot.style.boxShadow = busy
            ? '0 0 14px rgba(255,209,102,.65)'
            : '0 0 14px rgba(67,229,154,.65)';
    }
}


// =====================================================
// FILE SELECTION
// =====================================================

function choose(selectedFile) {

    if (!selectedFile) {
        return;
    }

    selected = selectedFile;

    filename.textContent = selectedFile.name;

    media.innerHTML = '';

    const url = URL.createObjectURL(selectedFile);

    let element;

    if (selectedFile.type.startsWith('video/')) {

        element = document.createElement('video');

        element.src = url;
        element.controls = true;
        element.muted = true;

    } else {

        element = document.createElement('img');

        element.src = url;
        element.alt = 'Selected track image';
    }

    media.appendChild(element);

    drop.classList.add('hidden');

    preview.classList.remove('hidden');

    stateText('File ready for analysis');
}


// =====================================================
// CHOOSE FILE
// =====================================================

$('choose').onclick = () => {
    file.click();
};


// =====================================================
// DROP ZONE
// =====================================================

drop.onclick = event => {

    if (!event.target.closest('button')) {
        file.click();
    }

};


// =====================================================
// FILE INPUT
// =====================================================

file.onchange = () => {
    choose(file.files[0]);
};


// =====================================================
// DRAG & DROP
// =====================================================

['dragenter', 'dragover'].forEach(eventName => {

    drop.addEventListener(eventName, event => {

        event.preventDefault();

        drop.classList.add('drag');

    });

});


['dragleave', 'drop'].forEach(eventName => {

    drop.addEventListener(eventName, event => {

        event.preventDefault();

        drop.classList.remove('drag');

    });

});


drop.ondrop = event => {

    choose(event.dataTransfer.files[0]);

};


// =====================================================
// REMOVE FILE
// =====================================================

$('remove').onclick = () => {

    selected = null;

    file.value = '';

    media.innerHTML = '';

    preview.classList.add('hidden');

    drop.classList.remove('hidden');

    stateText('Ready for analysis');

};


// =====================================================
// ANALYZE
// =====================================================

analyze.onclick = async () => {

    if (!selected) {

        alert('Please choose an image first.');

        return;
    }


    analyze.disabled = true;

    analyze.innerHTML = 'Analyzing <span>•••</span>';

    stateText(
        'Sending image to AI...',
        true
    );


    try {

        // Create form data
        const formData = new FormData();

        formData.append(
            'file',
            selected
        );


        // Send image to FastAPI
        const endpoint = selected.type.startsWith('video/')
            ? 'http://127.0.0.1:8000/analyze-video'
            : 'http://127.0.0.1:8000/analyze-image';

        const response = await fetch(
            endpoint,
            {
                method: 'POST',
                body: formData
            }
        );


        // Check response
        if (!response.ok) {

            throw new Error(
                `Backend returned ${response.status}`
            );

        }


        // Get REAL AI result
        const result = await response.json();


        console.log(
            'REAL AI RESULT:',
            result
        );


        // IMPORTANT:
        // Display REAL backend result
        // instead of demo result.
        render(result);


        stateText(
            'AI analysis complete'
        );


    } catch (error) {

        console.error(
            'Backend connection error:',
            error
        );


        stateText(
            'Backend connection failed'
        );


        alert(
            'Could not connect to the AI backend. ' +
            'Make sure FastAPI is running.'
        );

    }


    analyze.disabled = false;

    analyze.innerHTML =
        'Analyze again →';

};


// =====================================================
// RENDER RESULT
// =====================================================

function render(result) {

    const x =
        info[result.condition] || info.wet;

    const percentage =
        Math.round(result.confidence * 100);


    // Condition
    $('condition').textContent =
        x[0];


    // Icon
    $('icon').textContent =
        x[1];


    // Description
    $('sub').textContent =
        x[2];


    // Confidence
    $('confPill').textContent =
        percentage + '% CONF.';


    $('confidence').textContent =
        percentage + '%';


    $('bar').style.width =
        percentage + '%';


    // Frames
    const frameCount =
        result.frames
            ? result.frames.length
            : 1;


    $('frames').textContent =
        frameCount;


    $('count').textContent =
        frameCount + ' frames';


    // Trend
    const worsening =
        result.trend === 'worsening';


    $('trendPill').textContent =
        worsening
            ? '↘ WORSENING'
            : '↗ IMPROVING';


    $('trendPill').className =
        'pill ' +
        (worsening ? 'warn' : 'green');


    $('trend').textContent =
        worsening
            ? 'Getting worse'
            : 'Getting better';


    $('arrow').textContent =
        worsening
            ? '↘'
            : '↗';


    $('arrow').style.color =
        worsening
            ? '#ff2748'
            : '#43e59a';


    // Recommendation
    $('recTitle').textContent =
        result.recommendation;


    $('recText').textContent =
        result.recommendationText;


    $('recIcon').textContent =
        worsening
            ? '⚠'
            : '✓';


    $('recTag').textContent =
        worsening
            ? 'CAUTION'
            : 'STABLE';


    // Timeline
    if (result.frames) {

        drawFrames(
            result.frames
        );

        drawChart(
            result.frames
        );

    }

}


// =====================================================
// FRAME TIMELINE
// =====================================================

function drawFrames(frames) {

    $('timeline').innerHTML =

        frames.map(frame => {

            return `
                <div class="frame ${frame[1]}">

                    <small>
                        ${frame[0]}
                    </small>

                    <b>
                        ${frame[1].toUpperCase()}
                    </b>

                    <i></i>

                </div>
            `;

        }).join('');

}


// =====================================================
// CHART
// =====================================================

function drawChart(frames) {

    const svg = $('chart');

    const W = 700;
    const H = 230;
    const P = 25;

    const levels = {

        dry: 3,

        drying: 2.5,

        damp: 2,

        wet: 1

    };


    const points = frames.map(
        (frame, index) => {

            return {

                x:
                    P +
                    index /
                    Math.max(
                        frames.length - 1,
                        1
                    ) *
                    (W - 2 * P),

                y:
                    P +
                    (3 - levels[frame[1]]) /
                    2 *
                    (H - 2 * P)

            };

        }
    );


    let svgContent = '';


    // Grid
    [1, 2, 3].forEach(level => {

        const y =
            P +
            (3 - level) /
            2 *
            (H - 2 * P);


        svgContent += `

            <line
                x1="${P}"
                y1="${y}"
                x2="${W - P}"
                y2="${y}"
                stroke="#292d37"
            />

        `;

    });


    // Labels
    svgContent += `

        <text
            x="25"
            y="25"
            fill="#727987"
            font-size="10"
        >
            DRY
        </text>

        <text
            x="25"
            y="127"
            fill="#727987"
            font-size="10"
        >
            DAMP
        </text>

        <text
            x="25"
            y="210"
            fill="#727987"
            font-size="10"
        >
            WET
        </text>

    `;


    // Line
    if (points.length > 1) {

        const path =
            points
                .map(
                    (point, index) => {

                        return (
                            index === 0
                                ? 'M'
                                : 'L'
                        ) +
                            ' ' +
                            point.x +
                            ' ' +
                            point.y;

                    }
                )
                .join(' ');


        svgContent += `

            <path
                d="${path}"
                fill="none"
                stroke="#ff2748"
                stroke-width="4"
                stroke-linecap="round"
            />

        `;


        // Points
        points.forEach(point => {

            svgContent += `

                <circle
                    cx="${point.x}"
                    cy="${point.y}"
                    r="5"
                    fill="#0d0f14"
                    stroke="#ff2748"
                    stroke-width="3"
                />

            `;

        });

    }


    svg.innerHTML = svgContent;

}


// =====================================================
// INITIAL DISPLAY
// =====================================================

// This is the ONLY place where demo is used.
render(demo);