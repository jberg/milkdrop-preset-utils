import _ from "lodash";
import { varMap } from "./constants";

const baseValsDefaults = {
  decay: 0.98,
  gammaadj: 2,
  echo_zoom: 2,
  echo_alpha: 0,
  echo_orient: 0,
  red_blue: 0,
  brighten: 0,
  darken: 0,
  wrap: 1,
  darken_center: 0,
  solarize: 0,
  invert: 0,
  fshader: 0,
  b1n: 0,
  b2n: 0,
  b3n: 0,
  b1x: 1,
  b2x: 1,
  b3x: 1,
  b1ed: 0.25,
  wave_mode: 0,
  additivewave: 0,
  wave_dots: 0,
  wave_thick: 0,
  wave_a: 0.8,
  wave_scale: 1,
  wave_smoothing: 0.75,
  wave_mystery: 0,
  modwavealphabyvolume: 0,
  modwavealphastart: 0.75,
  modwavealphaend: 0.95,
  wave_r: 1,
  wave_g: 1,
  wave_b: 1,
  wave_x: 0.5,
  wave_y: 0.5,
  wave_brighten: 1,
  mv_x: 12,
  mv_y: 9,
  mv_dx: 0,
  mv_dy: 0,
  mv_l: 0.9,
  mv_r: 1,
  mv_g: 1,
  mv_b: 1,
  mv_a: 1,
  warpanimspeed: 1,
  warpscale: 1,
  zoomexp: 1,
  zoom: 1,
  rot: 0,
  cx: 0.5,
  cy: 0.5,
  dx: 0,
  dy: 0,
  warp: 1,
  sx: 1,
  sy: 1,
  ob_size: 0.01,
  ob_r: 0,
  ob_g: 0,
  ob_b: 0,
  ob_a: 0,
  ib_size: 0.01,
  ib_r: 0.25,
  ib_g: 0.25,
  ib_b: 0.25,
  ib_a: 0,
};

const shapeBaseValsDefaults = {
  enabled: 0,
  sides: 4,
  additive: 0,
  thickoutline: 0,
  textured: 0,
  num_inst: 1,
  tex_zoom: 1,
  tex_ang: 0,
  x: 0.5,
  y: 0.5,
  rad: 0.1,
  ang: 0,
  r: 1,
  g: 0,
  b: 0,
  a: 1,
  r2: 0,
  g2: 1,
  b2: 0,
  a2: 0,
  border_r: 1,
  border_g: 1,
  border_b: 1,
  border_a: 0.1,
};

const waveBaseValsDefaults = {
  enabled: 0,
  samples: 512,
  sep: 0,
  scaling: 1,
  smoothing: 0.5,
  r: 1,
  g: 1,
  b: 1,
  a: 1,
  spectrum: 0,
  usedots: 0,
  thick: 0,
  additive: 0,
};

function removeBaseValDefaults(baseVals, defaultVals) {
  const baseValsNonDefault = {};
  _.forEach(baseVals, (v, k) => {
    if (v !== defaultVals[k]) {
      baseValsNonDefault[k] = v;
    }
  });
  if (Object.prototype.hasOwnProperty.call(baseVals, "enabled")) {
    baseValsNonDefault.enabled = baseVals.enabled;
  }

  return baseValsNonDefault;
}

function getLinesWithPrefix(lines, prefix) {
  const regex = new RegExp(`${prefix}_\\d+=\`*`);
  const filteredLines = _.filter(lines, (line) => regex.test(line));
  return _.join(
    _.map(filteredLines, (line) => _.last(_.split(line, regex))),
    "\n"
  );
}

function getWarpShader(lines) {
  return getLinesWithPrefix(lines, "warp");
}

function getCompShader(lines) {
  return getLinesWithPrefix(lines, "comp");
}

function getPresetInit(lines) {
  return getLinesWithPrefix(lines, "per_frame_init");
}

function getPerFrame(lines) {
  return getLinesWithPrefix(lines, "per_frame");
}

function getPerVetex(lines) {
  return getLinesWithPrefix(lines, "per_pixel");
}

function getBaseVals(lines) {
  const baseVals = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const splitLine = _.split(line, "=");
    if (splitLine.length > 1) {
      const varName = splitLine[0].toLowerCase();
      const convertedVarName = varMap[varName];
      baseVals[convertedVarName || varName] = parseFloat(splitLine[1]);
    }
  }
  return baseVals;
}

function isNonBaseVal(line) {
  return (
    _.startsWith(line, "per_frame_init") ||
    _.startsWith(line, "per_frame") ||
    _.startsWith(line, "per_frame_pixel") ||
    _.startsWith(line, "wavecode") ||
    _.startsWith(line, "shapecode") ||
    _.startsWith(line, "warp_1") ||
    _.startsWith(line, "comp_1")
  );
}

function splitOutBaseVals(text) {
  const lines = _.split(text, "\n");
  return [
    _.join(
      _.takeWhile(lines, (line) => !isNonBaseVal(line)),
      "\n"
    ),
    _.join(
      _.dropWhile(lines, (line) => !isNonBaseVal(line)),
      "\n"
    ),
  ];
}

function getWaveOrShapeEQs(lines, prefix) {
  const regex = new RegExp(`${prefix}\\d+=`);
  const filteredLines = _.filter(lines, (line) => regex.test(line));
  return _.join(
    _.map(filteredLines, (line) => _.last(_.split(line, regex))),
    "\n"
  );
}

function getWaveOrShapeBaseVals(lines, prefix) {
  const filteredLines = _.filter(lines, (line) => _.startsWith(line, prefix));
  const trimmedLines = _.map(filteredLines, (line) =>
    _.replace(line, prefix, "")
  );
  return getBaseVals(trimmedLines);
}

function getVersion(text) {
  return _.includes(text, "MILKDROP_PRESET_VERSION=201") ? 2 : 1;
}

export function splitPreset(text) {
  const presetVersion = getVersion(text);
  const presetParts = splitOutBaseVals(text);
  const baseValLines = _.split(presetParts[0], "\n");
  const presetLines = _.split(presetParts[1], "\n");

  const baseVals = removeBaseValDefaults(
    getBaseVals(baseValLines),
    baseValsDefaults
  );
  const warp = getWarpShader(presetLines);
  const comp = getCompShader(presetLines);
  const presetInit = getPresetInit(presetLines);
  const perFrame = getPerFrame(presetLines);
  const perVertex = getPerVetex(presetLines);

  const shapes = [];
  for (let i = 0; i < 4; i++) {
    const shapeBaseValsPrefix = `shapecode_${i}_`;
    const shapeInitPrefix = `shape_${i}_init`;
    const shapePerFramePrefix = `shape_${i}_per_frame`;

    let shapeBaseVals = getWaveOrShapeBaseVals(
      presetLines,
      shapeBaseValsPrefix
    );
    shapeBaseVals = removeBaseValDefaults(shapeBaseVals, shapeBaseValsDefaults);

    if (shapeBaseVals.enabled) {
      shapes.push({
        baseVals: shapeBaseVals,
        init_eqs_str: getWaveOrShapeEQs(presetLines, shapeInitPrefix),
        frame_eqs_str: getWaveOrShapeEQs(presetLines, shapePerFramePrefix),
      });
    } else {
      shapes.push({ baseVals: { enabled: 0 } });
    }
  }

  const waves = [];
  for (let i = 0; i < 4; i++) {
    const waveBaseValsPrefix = `wavecode_${i}_`;
    const waveInitPrefix = `wave_${i}_init`;
    const wavePerFramePrefix = `wave_${i}_per_frame`;
    const wavePerPointPrefix = `wave_${i}_per_point`;

    let waveBaseVals = getWaveOrShapeBaseVals(presetLines, waveBaseValsPrefix);
    waveBaseVals = removeBaseValDefaults(waveBaseVals, waveBaseValsDefaults);

    if (waveBaseVals.enabled !== 0) {
      waves.push({
        baseVals: waveBaseVals,
        init_eqs_str: getWaveOrShapeEQs(presetLines, waveInitPrefix),
        frame_eqs_str: getWaveOrShapeEQs(presetLines, wavePerFramePrefix),
        point_eqs_str: getWaveOrShapeEQs(presetLines, wavePerPointPrefix),
      });
    } else {
      waves.push({ baseVals: { enabled: 0 } });
    }
  }

  return {
    presetVersion,
    baseVals,
    presetInit,
    perFrame,
    perVertex,
    waves,
    shapes,
    warp,
    comp,
  };
}

export function createBasePresetFuns(parsedPreset, shapes, waves) {
  const presetMap = { shapes: [], waves: [] };
  presetMap.init_eqs_str = parsedPreset.perFrameInitEQs
    ? parsedPreset.perFrameInitEQs.trim()
    : "";
  presetMap.frame_eqs_str = parsedPreset.perFrameEQs
    ? parsedPreset.perFrameEQs.trim()
    : "";
  presetMap.pixel_eqs_str = parsedPreset.perPixelEQs
    ? parsedPreset.perPixelEQs.trim()
    : "";

  for (let i = 0; i < parsedPreset.shapes.length; i++) {
    if (shapes[i].baseVals.enabled !== 0) {
      presetMap.shapes.push(
        _.assign({}, shapes[i], {
          init_eqs_str: parsedPreset.shapes[i].perFrameInitEQs
            ? parsedPreset.shapes[i].perFrameInitEQs
            : "",
          frame_eqs_str: parsedPreset.shapes[i].perFrameEQs
            ? parsedPreset.shapes[i].perFrameEQs
            : "",
        })
      );
    } else {
      presetMap.shapes.push(shapes[i]);
    }
  }

  for (let i = 0; i < parsedPreset.waves.length; i++) {
    if (waves[i].baseVals.enabled !== 0) {
      presetMap.waves.push(
        _.assign({}, waves[i], {
          init_eqs_str: parsedPreset.waves[i].perFrameInitEQs
            ? parsedPreset.waves[i].perFrameInitEQs
            : "",
          frame_eqs_str: parsedPreset.waves[i].perFrameEQs
            ? parsedPreset.waves[i].perFrameEQs
            : "",
          point_eqs_str: parsedPreset.waves[i].perPointEQs
            ? parsedPreset.waves[i].perPointEQs
            : "",
        })
      );
    } else {
      presetMap.waves.push(waves[i]);
    }
  }

  return presetMap;
}

// Shader Utils

export function getShaderParts(t) {
  const sbIndex = t.indexOf("shader_body");
  if (t && sbIndex > -1) {
    const beforeShaderBody = t.substring(0, sbIndex);
    const afterShaderBody = t.substring(sbIndex);
    const firstCurly = afterShaderBody.indexOf("{");
    const lastCurly = afterShaderBody.lastIndexOf("}");
    const shaderBody = afterShaderBody.substring(firstCurly + 1, lastCurly);
    return [beforeShaderBody, shaderBody];
  }

  return ["", t];
}

export function prepareShader(shader) {
  if (shader.length === 0) {
    return "";
  }

  let shaderFixed = _.replace(shader, "sampler sampler_pw_noise_lq;\n", "");
  shaderFixed = _.replace(shaderFixed, "sampler2D sampler_pw_noise_lq;\n", "");
  shaderFixed = _.replace(shaderFixed, "sampler sampler_pw_noise_hq;\n", "");
  shaderFixed = _.replace(shaderFixed, "sampler2D sampler_pw_noise_hq;\n", "");

  const shaderParts = getShaderParts(shaderFixed);
  const fullShader = `#define  M_PI   3.14159265359
   #define  M_PI_2 6.28318530718
   #define  M_INV_PI_2  0.159154943091895

   uniform sampler2D sampler_main;
   uniform sampler2D sampler_fw_main;
   uniform sampler2D sampler_pw_main;
   uniform sampler2D sampler_fc_main;
   uniform sampler2D sampler_pc_main;

   uniform sampler2D sampler_noise_lq;
   uniform sampler2D sampler_noise_lq_lite;
   uniform sampler2D sampler_noise_mq;
   uniform sampler2D sampler_noise_hq;
   uniform sampler3D sampler_noisevol_lq;
   uniform sampler3D sampler_noisevol_hq;

   uniform sampler2D sampler_pw_noise_lq;

   uniform sampler2D sampler_blur1;
   uniform sampler2D sampler_blur2;
   uniform sampler2D sampler_blur3;

   float4 texsize_noise_lq;
   float4 texsize_noise_mq;
   float4 texsize_noise_hq;
   float4 texsize_noise_lq_lite;
   float4 texsize_noisevol_lq;
   float4 texsize_noisevol_hq;

   float4 _qa;
   float4 _qb;
   float4 _qc;
   float4 _qd;
   float4 _qe;
   float4 _qf;
   float4 _qg;
   float4 _qh;

   float q1;
   float q2;
   float q3;
   float q4;
   float q5;
   float q6;
   float q7;
   float q8;
   float q9;
   float q10;
   float q11;
   float q12;
   float q13;
   float q14;
   float q15;
   float q16;
   float q17;
   float q18;
   float q19;
   float q20;
   float q21;
   float q22;
   float q23;
   float q24;
   float q25;
   float q26;
   float q27;
   float q28;
   float q29;
   float q30;
   float q31;
   float q32;

   float blur1_min;
   float blur1_max;
   float blur2_min;
   float blur2_max;
   float blur3_min;
   float blur3_max;

   float scale1;
   float scale2;
   float scale3;
   float bias1;
   float bias2;
   float bias3;

   float4 slow_roam_cos;
   float4 roam_cos;
   float4 slow_roam_sin;
   float4 roam_sin;

   float3 hue_shader;

   float time;
   float4 rand_preset;
   float4 rand_frame;
   float  progress;
   float  frame;
   float  fps;
   float  decay;
   float  bass;
   float  mid;
   float  treb;
   float  vol;
   float  bass_att;
   float  mid_att;
   float  treb_att;
   float  vol_att;
   float4 texsize;
   float4 aspect;

   float rad;
   float ang;
   float2 uv_orig;

   #define GetMain(uv) (tex2D(sampler_main,uv).xyz)
   #define GetPixel(uv) (tex2D(sampler_main,uv).xyz)
   #define GetBlur1(uv) (tex2D(sampler_blur1,uv).xyz*scale1 + bias1)
   #define GetBlur2(uv) (tex2D(sampler_blur2,uv).xyz*scale2 + bias2)
   #define GetBlur3(uv) (tex2D(sampler_blur3,uv).xyz*scale3 + bias3)

   #define lum(x) (dot(x,float3(0.32,0.49,0.29)))
   #define tex2d tex2D
   #define tex3d tex3D

   ${_.replace(shaderParts[0], "sampler sampler_", "sampler2D sampler_")}

   float4 shader_body (float2 uv : TEXCOORD0) : COLOR0
   {
       float3 ret;

       ${shaderParts[1]}

       return float4(ret, 1.0);
   }`;

  return fullShader;
}

function isUserSampler(line) {
  if (!_.startsWith(line, "uniform sampler")) {
    return false;
  }

  const builtinSamplers = [
    "sampler_main",
    "sampler_fw_main",
    "sampler_pw_main",
    "sampler_fc_main",
    "sampler_pc_main",
    "sampler_noise_lq",
    "sampler_noise_lq_lite",
    "sampler_noise_mq",
    "sampler_noise_hq",
    "sampler_pw_noise_lq",
    "sampler_noisevol_lq",
    "sampler_noisevol_hq",
    "sampler_blur1",
    "sampler_blur2",
    "sampler_blur3",
  ];

  const re = /uniform sampler2D sampler_(.+);$/;
  const matches = line.match(re);
  if (matches && matches.length > 1) {
    return !_.includes(builtinSamplers, `sampler_${matches[1]}`);
  }

  return false;
}

const hlslUniformsString = `vec4 texsize_noise_lq;
vec4 texsize_noise_mq;
vec4 texsize_noise_hq;
vec4 texsize_noise_lq_lite;
vec4 texsize_noisevol_lq;
vec4 texsize_noisevol_hq;
vec4 _qa;
vec4 _qb;
vec4 _qc;
vec4 _qd;
vec4 _qe;
vec4 _qf;
vec4 _qg;
vec4 _qh;
float q1;
float q2;
float q3;
float q4;
float q5;
float q6;
float q7;
float q8;
float q9;
float q10;
float q11;
float q12;
float q13;
float q14;
float q15;
float q16;
float q17;
float q18;
float q19;
float q20;
float q21;
float q22;
float q23;
float q24;
float q25;
float q26;
float q27;
float q28;
float q29;
float q30;
float q31;
float q32;
float blur1_min;
float blur1_max;
float blur2_min;
float blur2_max;
float blur3_min;
float blur3_max;
float scale1;
float scale2;
float scale3;
float bias1;
float bias2;
float bias3;
vec4 slow_roam_cos;
vec4 roam_cos;
vec4 slow_roam_sin;
vec4 roam_sin;
vec3 hue_shader;
float time;
vec4 rand_preset;
vec4 rand_frame;
float progress;
float frame;
float fps;
float decay;
float bass;
float mid;
float treb;
float vol;
float bass_att;
float mid_att;
float treb_att;
float vol_att;
vec4 texsize;
vec4 aspect;
float rad;
float ang;
vec2 uv_orig;
`;

export function processUnOptimizedShader(shader) {
  if (_.isEmpty(shader)) {
    return "";
  }

  let processedShader = shader.replace(
    /#version 300 es\sprecision highp float;/,
    ""
  );
  processedShader = processedShader.replace("in vec2 frag_TEXCOORD0;\n", "");
  processedShader = processedShader.replace("out vec4 rast_FragData[1];\n", "");
  processedShader = processedShader.replace(
    /vec2 uv;\s+uv = frag_TEXCOORD0;\n\s{4}/,
    ""
  );
  processedShader = processedShader.replace(
    /void main\(\)\s\{\s/,
    "shader_body {\n"
  );
  processedShader = processedShader.replace(
    "rast_FragData[0] = result;",
    "ret = result.rgb;"
  );

  const shaderParts = getShaderParts(processedShader);
  let fragShaderHeaderText = shaderParts[0];
  const fragShaderText = shaderParts[1];

  fragShaderHeaderText = fragShaderHeaderText.replace(hlslUniformsString, "");
  const shaderHeaderLines = _.split(fragShaderHeaderText, "\n");
  const fileredHeaderLines = _.filter(
    shaderHeaderLines,
    (line) =>
      !(
        _.startsWith(line, "in") ||
        (_.startsWith(line, "uniform") && !isUserSampler(line))
      )
  );
  fragShaderHeaderText = _.join(fileredHeaderLines, "\n");

  return `${fragShaderHeaderText} shader_body { ${fragShaderText} }`;
}

export function processOptimizedShader(shader) {
  if (_.isEmpty(shader)) {
    return "";
  }

  let processedShader = _.replace(shader, "#version 300 es\n", "");
  processedShader = _.replace(processedShader, "void main ()", "shader_body");
  processedShader = _.replace(processedShader, /highp\s*/g, "");
  processedShader = _.replace(processedShader, /medp\s*/g, "");
  processedShader = _.replace(processedShader, /lowp\s*/g, "");
  processedShader = _.replace(processedShader, /xlv_TEXCOORD0/g, "uv");
  processedShader = _.replace(
    processedShader,
    /_glesFragData\[0\] = (.+);\n\}/,
    (match, varName) => `ret = ${varName}.xyz;\n}`
  );
  processedShader = _.replace(
    processedShader,
    "out vec4 _glesFragData[4];\n",
    ""
  );

  const shaderParts = getShaderParts(processedShader);
  let fragShaderHeaderText = shaderParts[0];
  let fragShaderText = shaderParts[1];

  const shaderHeaderLines = _.split(fragShaderHeaderText, "\n");
  const fileredHeaderLines = _.filter(
    shaderHeaderLines,
    (line) =>
      !(
        _.startsWith(line, "in") ||
        (_.startsWith(line, "uniform") && !isUserSampler(line))
      )
  );
  fragShaderHeaderText = _.join(fileredHeaderLines, "\n");

  let shaderBodyLines = _.split(fragShaderText, ";");
  shaderBodyLines = _.dropWhile(shaderBodyLines, (line) => {
    const trimmedLine = _.trim(line);
    if (_.startsWith(trimmedLine, "xlat_mutable")) {
      const matches = trimmedLine.match(/xlat_mutable(.+)\s*=\s*(.+)/);
      if (
        matches &&
        matches.length === 3 &&
        _.trim(matches[1]) === _.trim(matches[2])
      ) {
        return true;
      }
    }
    return false;
  });
  fragShaderText = _.join(shaderBodyLines, ";");

  return `${fragShaderHeaderText} shader_body { ${fragShaderText} }`;
}
