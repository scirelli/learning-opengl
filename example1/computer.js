'use strict';

var Computer = function(container) {
  function getExperimentalWebGL(canvas) {
    try {
      return container.getContext("webgl2",{ preserveDrawingBuffer: false });
    } catch(e) {
      return null;
    }
  }

  function getProgram(gl, vertexShader, fragmentShader) {
    var prog_animateram = gl.createProgram();
    gl.attachShader(prog_animateram, getShader(gl, vertexShader, gl.VERTEX_SHADER));
    gl.attachShader(prog_animateram, getShader(gl, fragmentShader, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog_animateram);
    return prog_animateram;
  }

  function getShader(gl, shaderCode, shaderType) {
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);
    if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)==0)
      throw (gl.getShaderInfoLog(shader) + '[' + ']');
    return shader;
  }

  function getInitialArray(radius,velocity,sx,sy) {
    console.log(sx,sy);
    var fsx = 256/sx;
    var fsy = 256/sy;
    var array = [];
    for(var y=0;y<sy;y++) {
      for(var x=0;x<sx;x++) {
        array.push(x*fsx,y*fsy,0,0);
        // var r = Math.sqrt(Math.random())*radius;
        // var rv = Math.sqrt(Math.random())*velocity;
        // var t = Math.random()*Math.PI*2;
        // var tv = Math.random()*Math.PI*2;
        // array.push(Math.sin(t)*r,Math.cos(t)*r,Math.sin(tv)*rv,Math.cos(tv)*rv);
      }
    }
    console.log(array);
    return array;
  }
  function getTextureCoordinates() {
    var vertices = [];
    var dy = 1/Computer.BufferSizeY;
    var dx = 1/(Computer.BufferSizeX*2);
    for ( var y = 0; y < 1; y += dy )
      for ( var x = 0; x < 1; x += dx )
        vertices.push(x, y);
    return vertices;
  }


  function createTexture(x,y,initialValues,activeTexture) {
    var rv = gl.createTexture();
    gl.activeTexture(activeTexture);
    gl.bindTexture(gl.TEXTURE_2D, rv);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
/*    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
*/
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    console.log(window.gl=gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, x, y, 0 , gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(initialValues));
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32I, x, y, 0, gl.RGBA_INTEGER, gl.INT, new Int32Array(initialValues));
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32UI, x, y, 0, gl.RGBA_INTEGER, gl.UNSIGNED_INT, new Uint32Array(initialValues));
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, x, y, 0, gl.RGBA, gl.FLOAT, new Float32Array(initialValues));
    return rv;
  }

  function getFrameBuffterObject(texture) {
    console.log(texture);
    var rv = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rv);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if( gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
      throw ("Error while generating Frame Buffer Object.");
    return rv;
  }

  var frame = 0;
  var sourceBuffer;
  var destinationBuffer;
  function draw() {
    sourceBuffer = 1*!(destinationBuffer = (++frame)%2)

    gl.useProgram(prog_animate);
    gl.viewport(0, 0, Computer.BufferSizeX, Computer.BufferSizeY);
    gl.uniform1i(glLocations.sampLoc, sourceBuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, FrameBufferObject[destinationBuffer]);
    if(frame%51==0) gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.useProgram(prog_geomery);
    gl.viewport(0, 0, (Computer.BufferSizeX*2), Computer.BufferSizeY);
    gl.uniform1i(glLocations.sampLocPrevious, sourceBuffer);
    gl.uniform1i(glLocations.sampLocCurrent, destinationBuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, FrameBufferObject[2]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.useProgram(prog_display);
    gl.viewport(0, 0, Math.min(size.x,size.y), Math.min(size.x,size.y));
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.enable(gl.BLEND);
    // dots
    gl.uniform1i(glLocations.uTexSamp, 1);
    gl.drawArrays(gl.POINTS, 0, (Computer.BufferSizeX*2)*Computer.BufferSizeY);
    // lines
    gl.uniform1i(glLocations.uTexSamp, 2);
    gl.drawArrays(gl.LINES, 0, (Computer.BufferSizeX*2)*Computer.BufferSizeY);

    gl.disable(gl.BLEND);

    requestAnimationFrame(draw);
  }


  var gl;
  var ext;
  var glLocations = {};
  var FrameBufferObject = [];
  var prog_animate;
  var prog_geomery;
  var prog_display;
  var size = {};

  initialize();
  return;



  function initialize() {
    size = {x:window.innerWidth, y:window.innerHeight};
    container.height = container.width = Math.min(size.x,size.y);
    if(!window.WebGLRenderingContext) throw "WebGL is not supported.";
    if((gl=getExperimentalWebGL(container))==null) throw "Can't get WebGL";
    //if((gl.getExtension("OES_texture_float"))==null) return showError("No floating point texture support.");
    if(!gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)) throw "Vertex textures not supported.";

    // arrays for calculations & animation
    FrameBufferObject[0] = getFrameBuffterObject(createTexture(Computer.BufferSizeX,Computer.BufferSizeY,getInitialArray(0,0,Computer.BufferSizeX,Computer.BufferSizeY),gl.TEXTURE0));
    FrameBufferObject[1] = getFrameBuffterObject(createTexture(Computer.BufferSizeX,Computer.BufferSizeY,getInitialArray(0,0,Computer.BufferSizeX,Computer.BufferSizeY),gl.TEXTURE1));

    // array for geometry
    FrameBufferObject[2] = getFrameBuffterObject(createTexture((Computer.BufferSizeX*2),Computer.BufferSizeY,getInitialArray(0,0,(Computer.BufferSizeX*2),Computer.BufferSizeY),gl.TEXTURE2));

    prog_animate = getProgram(gl, Computer.Shaders.vs_anim, Computer.Shaders.fs_anim);
    prog_geomery = getProgram(gl, Computer.Shaders.vs_geom, Computer.Shaders.fs_geom);
    prog_display = getProgram(gl, Computer.Shaders.vs_disp, Computer.Shaders.fs_disp);

    gl.useProgram(prog_animate);
    glLocations.phyDistNear = gl.getUniformLocation(prog_animate, "phyDistNear");
    glLocations.phyForceNear = gl.getUniformLocation(prog_animate, "phyForceNear");
    glLocations.phyDistMed = gl.getUniformLocation(prog_animate, "phyDistMed");
    glLocations.phyForceMed = gl.getUniformLocation(prog_animate, "phyForceMed");
    glLocations.phyForceFar = gl.getUniformLocation(prog_animate, "phyForceFar");
    glLocations.phyForceDrag = gl.getUniformLocation(prog_animate, "phyForceDrag");

    gl.uniform1f(glLocations.phyForceNear, -0.01);
    gl.uniform1f(glLocations.phyDistNear, 0.01);
    gl.uniform1f(glLocations.phyDistMed, 0.06);
    gl.uniform1f(glLocations.phyForceMed, 0.00005);
    gl.uniform1f(glLocations.phyForceFar, 0.0000017);
    gl.uniform1f(glLocations.phyForceDrag, 0.997);
    glLocations.aPositionLoc = gl.getAttribLocation(prog_animate, "aPositionLoc");
    glLocations.aTexLoc = gl.getAttribLocation(prog_animate, "aTexLoc");
    gl.enableVertexAttribArray(glLocations.aPositionLoc);
    gl.enableVertexAttribArray(glLocations.aTexLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,0,0, -1,1,0,1, 1,-1,1,0, 1,1,1,1]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(glLocations.aPositionLoc, 2, gl.FLOAT, gl.FALSE, 16, 0);
    gl.vertexAttribPointer(glLocations.aTexLoc, 2, gl.FLOAT, gl.FALSE, 16, 8);
    glLocations.sampLoc = gl.getUniformLocation(prog_animate, "sampLoc");
    glLocations.sampLocPrevious = gl.getUniformLocation(prog_geomery, "sampLocPrevious");
    glLocations.sampLocCurrent = gl.getUniformLocation(prog_geomery, "sampLocCurrent");
    glLocations.aPointsLoc = 3;
    gl.bindAttribLocation(prog_display, glLocations.aPointsLoc, "aPoints");
    gl.linkProgram(prog_display);

    gl.enableVertexAttribArray(glLocations.aPointsLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(getTextureCoordinates()), gl.STATIC_DRAW);
    gl.vertexAttribPointer(glLocations.aPointsLoc, 2, gl.FLOAT, false, 0, 0);
    glLocations.uTexSamp = gl.getUniformLocation(prog_display, "uTexSamp");

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    requestAnimationFrame(draw);
  }

}

Computer.BufferSizeX = 256;
Computer.BufferSizeY = 256;
Computer.Shaders = {}

/* This shader writes new buffer using calculations made on sampLoc (source buffer) */
Computer.Shaders.fs_anim = `
precision highp float;
uniform sampler2D sampLoc;
varying vec2 vTexCoord;

uniform float phyDistNear;
uniform float phyForceNear;
uniform float phyDistMed;
uniform float phyForceMed;
uniform float phyForceFar;
uniform float phyForceDrag;

const float dx = 1.0/${Computer.BufferSizeX}.0;
const float dy = 1.0/${Computer.BufferSizeY}.0;

void main() {
  vec2 position = texture2D(sampLoc, vTexCoord).xy;
  vec2 velocity = texture2D(sampLoc, vTexCoord).zw;

  for(float y = 0.0; y < 1.0; y += dy ) {
    for(float x = 0.0; x < 1.0; x += dx ) {
      vec2 otherbody = texture2D(sampLoc, vTexCoord + vec2(x, y)).xy;
      vec2 othervelocity = texture2D(sampLoc, vTexCoord + vec2(x, y)).zw;
      float distance = length(position - otherbody);

      float pushforce;
      if(distance<phyDistNear) {
        pushforce = phyForceNear;
      } else if(distance<phyDistMed) {
        pushforce = phyForceMed;
      } else {
        pushforce = (distance * distance) * phyForceFar;
      }

      velocity += (otherbody - position) * pushforce;

    }
  }

  position += vec2(velocity.xy);
  velocity *= phyForceDrag;
  gl_FragColor = vec4(position, velocity.xy);
}
`;

Computer.Shaders.vs_anim = `
attribute vec4 aPositionLoc;
attribute vec2 aTexLoc;
varying   vec2 vTexCoord;

void main() {
  gl_Position = vec4(aPositionLoc.x,aPositionLoc.y, 1, 1);
  vTexCoord = aTexLoc;
}
`;

/* pick alternating values from the buffer for form coordinate pairs in a matrix twice the size of the single buffer */
Computer.Shaders.fs_geom = `
precision highp float;
uniform sampler2D sampLocPrevious;
uniform sampler2D sampLocCurrent;
varying vec2 vTexCoord;

void main() {
  vec4 previous = texture2D(sampLocPrevious, vTexCoord).xyzw;
  vec4 current = texture2D(sampLocCurrent, vTexCoord).xyzw;

  int p = int(vTexCoord.x*${(Computer.BufferSizeX*2)}.0);
  if(p/2*2==p) {
    gl_FragColor = vec4(current.x,current.y,current.z,current.w);
  } else {
    gl_FragColor = vec4(previous.x,previous.y,previous.z,previous.w);
  }
}
`;

Computer.Shaders.vs_geom = `
attribute vec4 gPositionLoc;
attribute vec2 gTexLoc;
varying   vec2 vTexCoord;

void main() {
  gl_Position = vec4(gPositionLoc.x,gPositionLoc.y, 1, 1);
  vTexCoord = gTexLoc;
}
`;

Computer.Shaders.fs_disp = `
precision highp float;
varying vec4 colour;

void main() {
  gl_FragColor = colour;
}
`;

Computer.Shaders.vs_disp = `
attribute vec2 aPoints;
uniform sampler2D uTexSamp;
varying vec4 colour;

void main() {
  float spd = length(texture2D(uTexSamp, aPoints).zw) * 100.0 + 0.1;
  colour = vec4( 1.0, 1.0, 1.0, 1.0 );//vec4( spd*5.0, spd*1.2, spd*0.8, 1.0 );
  gl_Position = vec4( 2.0 * texture2D(uTexSamp, aPoints).x - 1.0, 2.0 * texture2D(uTexSamp, aPoints).y - 1.0, 1.0, 1.0);
  gl_PointSize = 1.;
}
`;



window['Computer'] = Computer;
