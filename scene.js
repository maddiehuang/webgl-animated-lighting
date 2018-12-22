"use strict";

var gl;   // The webgl context.

var a_coords_loc;       // Location of the a_coords attribute variable in the shader program.
var a_normal_loc;       // Location of a_normal attribute.

var a_coords_buffer;    // Buffer for a_coords.
var a_normal_buffer;    // Buffer for a_normal.
var index_buffer;       // Buffer for indices.

var u_diffuseColor;     // Locations of uniform variables in the shader program
var u_specularColor;
var u_specularExponent;
var u_lightPosition;
var u_headlight1Position;
var u_headlight2Position;
var u_coneDirection;
var u_modelview;
var u_projection;
var u_normalMatrix;
var u_glowing;
var u_shiny;
var u_headlights;

var projection = mat4.create();          // projection matrix
var modelview;                           // modelview matrix
var normalMatrix = mat3.create();        // matrix, derived from model and view matrix, for transforming normal vectors
var rotator;

var world = [         // Objects for display
    uvCylinder(4.5, .5, 64, false, false),
    ring(3.5, 2.3, 64),
    uvSphere(),
];

var lamppost =
    [
        uvCylinder(.09, 1.5, 16, true, true),
        uvSphere(.2, 16, 16),
    ]

var tree =
    [
        uvCylinder(.2, .5, 24, true, true),
        uvCone(.5, 2, 24, false),
    ]

var car =
    [
        cube(),
        uvTorus(.2, .1, 8, 8),
        uvCylinder(.1, .05, 8, false, true),
    ]

var sun_rot = 0;
var car_rot = 0;
var wheel_rot = 0;

function rad(degrees)
{
    return 0.0174533 * degrees;
}

function deg(radians)
{
    return 57.2958 * radians;
}

function scale(x, y, z)
{
    mat4.scale(modelview, modelview, [x, y, z]);
}

function translate(x, y, z)
{
    mat4.translate(modelview, modelview, [x, y, z]);
}

function rotateX(degrees)
{
    mat4.rotateX(modelview, modelview, rad(degrees));
}

function rotateY(degrees)
{
    mat4.rotateY(modelview, modelview, rad(degrees));
}

function rotateZ(degrees)
{
    mat4.rotateZ(modelview, modelview, rad(degrees));
}

function addTree(modelview, x, y, z, s)
{
    translate(x, -1 * z, (s - 1) * .25);
    scale(s, s, s);

    // ---------- TREE STUMP ---------- //

    gl.uniform4f(u_diffuseColor, .65, .55, .45, 1);

    // install
    installModel(tree[0]);
    update_uniform(tree[0]);

    // undo

    // ---------- TREE LEAVES ---------- //

    gl.uniform4f(u_diffuseColor, .3, .5, .4, 1);

    // install
    installModel(tree[1]);
    translate(0, 0, 1.25);
    update_uniform(tree[1]);

    // undo
    translate(0, 0, -1.25);

    scale(1 / s, 1 / s, 1 / s);
    translate(-1 * x, z, (s - 1) * -.25);
}

function addTree2(modelview, radius, degrees, s)
{
    addTree(modelview, Math.cos(-1 * rad(degrees)) * radius, 0, Math.sin(-1 * rad(degrees)) * radius, s);
}

function addWheel(modelview, x, z)
{
    gl.uniform4f(u_diffuseColor, .2, .2, .2, 1);

    // install
    installModel(car[1]);
    translate(x, 0, z);
    rotateY(90);
    rotateZ(wheel_rot);
    update_uniform(car[1]);

    // ---------- SPOKE ---------- //

    gl.uniform4f(u_diffuseColor, .8, .8, .8, 1);

    // add spokes
    addSpoke(modelview, 0);
    addSpoke(modelview, 45);

    // undo
    rotateZ(-1 * wheel_rot);
    rotateY(-90);
    translate(-1 * x, 0, -1 * z);
}

function addSpoke(modelview, degrees)
{
    // install
    installModel(car[0]);
    scale(.05, .2, .05);
    update_uniform(car[0]);

    // undo
    scale(20, 5, 20);

    // install
    installModel(car[0]);
    scale(.2, .05, .05);
    update_uniform(car[0]);

    // undo
    scale(5, 20, 20);
}

function draw() {
    sun_rot = sun_rot % 360;
    car_rot = car_rot % 360;
    wheel_rot = wheel_rot % 360;

    if (sun_rot < 180)
        gl.clearColor(.6, .85, 1, 1);
    else
        gl.clearColor(.1, .1, .2, 1);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(projection, Math.PI / 5, 1, 10, 20);
    modelview = rotator.getViewMatrix();

    rotateX(30);
    scale(.8, .8, .8);

    // ---------- MAIN DISC ---------- //

    gl.uniform4f(u_diffuseColor, .60, .8, .55, 1);

    // install
    installModel(world[0]);
    translate(0, -.75, 0);
    rotateX(90);
    update_uniform(world[0]);

    // undo
    rotateX(-90);
    translate(0, .75, 0);

    // ---------- ROAD ---------- //

    gl.uniform4f(u_diffuseColor, .6, .6, .6, 1);

    // install
    installModel(world[1]);
    translate(0, -.499, 0);
    rotateX(-90);
    update_uniform(world[1]);

    // undo
    rotateX(90);
    translate(0, .499, 0);

    // ---------- LAMPPOST ---------- //

    gl.uniform4f(u_diffuseColor, .5, .5, .5, 1);

    // install
    installModel(lamppost[0]);
    translate(0, .25, 0);
    rotateX(90);
    update_uniform(lamppost[0]);

    // undo
    rotateX(-90);
    translate(0, -.25, 0);

    // ---------- LAMP SPHERE ---------- //

    gl.uniform4f(u_diffuseColor, 1, 1, 1, 1);

    if (sun_rot > 180)
    {
        gl.uniform1i(u_glowing, 1);
        gl.uniform1i(u_shiny, 0);
    }
    else {
        gl.uniform1i(u_glowing, 0);
        gl.uniform1i(u_shiny, 1);
    }

    // install
    installModel(lamppost[1]);
    translate(0, 1.5, .5);
    if (sun_rot > 180) {
        gl.uniform4f(u_lightPosition, modelview[12], modelview[13], modelview[14], 1);
    }
    translate(0, -.5, -.5);
    update_uniform(lamppost[1]);

    // undo
    translate(0, -1, 0);

    // ---------- TREES ---------- //

    gl.uniform1i(u_glowing, 0);
    gl.uniform1i(u_shiny, 0);

    rotateX(-90);
    translate(0, 0, -.25);

    addTree(modelview, 1, 0, -.5, 1);
    addTree(modelview, 0, 0, -1.5, 1.5);
    addTree(modelview, -1, 0, -.5, 1.2);

    addTree2(modelview, 4, 45, 1.25);
    addTree2(modelview, 4, 30, .85);
    addTree2(modelview, 4, 135, .80);
    addTree2(modelview, 4, 150, 1.25);
    addTree2(modelview, 4, 180, 1);
    addTree2(modelview, 4, -30, 1);

    translate(0, 0, .25);
    rotateX(90);

    // ---------- SUN ---------- //

    gl.uniform4f(u_diffuseColor, .5, .5, .5, 1);

    if (sun_rot < 180)
    {
        gl.uniform1i(u_glowing, 1);
        gl.uniform1i(u_shiny, 0);
    }
    else {
        gl.uniform1i(u_glowing, 0);
        gl.uniform1i(u_shiny, 1);
    }

    // install
    installModel(world[2]);
    translate(0, -.75, 0);
    rotateZ(sun_rot);
    translate(6, 0, 1);

    if (sun_rot < 180) {
        gl.uniform4f(u_lightPosition, modelview[12], modelview[13], modelview[14], 0);
    }

    update_uniform(world[2]);

    // undo
    translate(-6, 0, -1);
    rotateZ(-1 * sun_rot);
    translate(0, .75, 0);

    // ---------- CAR ---------- //

    gl.uniform4f(u_diffuseColor, .6, .3, .3, 1);
    gl.uniform1i(u_glowing, 0);

    rotateY(car_rot);
    translate(-2.9, -.2, 0);

    // ---------- CAR BODY ---------- //

    gl.uniform1i(u_shiny, 1);

    // install
    installModel(car[0]);
    scale(.5, .3, 1);
    update_uniform(car[0]);

    // undo
    scale(2, 1 / .3, 1);

    // ---------- CAR ROOF ---------- //

    // install
    installModel(car[0]);
    translate(0, .25, -.1);
    scale(.5, .25, .5);
    update_uniform(car[0]);

    // undo
    scale(2, 4, 2);
    translate(0, -.25, .1);

    // ---------- CAR HEADLIGHTS ---------- //

    gl.uniform4f(u_diffuseColor, .9, .9, .9, 1);

    if (sun_rot > 180)
    {
        gl.uniform1i(u_glowing, 1);
        gl.uniform1i(u_shiny, 0);
        gl.uniform1i(u_headlights, 1);
    }
    else {
        gl.uniform1i(u_glowing, 0);
        gl.uniform1i(u_shiny, 1);
        gl.uniform1i(u_headlights, 0);
    }

    // install
    installModel(car[2]);
    translate(.15, -.025, .6);

    gl.uniform4f(u_headlight1Position, modelview[12], modelview[13], modelview[14], 1);
    translate(0, 3, 10);
    gl.uniform4f(u_coneDirection, modelview[12], modelview[13], modelview[14], 1);
    translate(0, -3, -10);

    translate(0, 0, -.1);
    update_uniform(car[2]);

    installModel(car[2]);
    translate(-.3, 0, .1);
    gl.uniform4f(u_headlight2Position, modelview[12], modelview[13], modelview[14], 1);
    translate(0, 0, -.1);
    update_uniform(car[2]);

    // undo
    translate(.15, .025, -.5);

    // ---------- CAR WHEELS ---------- //

    gl.uniform1i(u_glowing, 0);
    gl.uniform1i(u_shiny, 0);

    translate(0, -.1, 0);

    addWheel(modelview, .3, .3);
    addWheel(modelview, .3, -.3);
    addWheel(modelview, -.3, .3);
    addWheel(modelview, -.3, -.3);

    translate(0, .1, 0);

    // undo car transforms
    translate(2.9, .2, 0);
    rotateY(-1 * car_rot);

    // ---------- LIGHTS ---------- //

    if (document.getElementById("animate").checked == true) {
        sun_rot += 1;
        car_rot += 2;
        wheel_rot += 8;
    }
}

/*
  this function assigns the computed values to the uniforms for the model, view and projection
  transform
*/
function update_uniform(modelData){

    /* Get the matrix for transforming normal vectors from the modelview matrix,
       and send matrices to the shader program*/
    mat3.normalFromMat4(normalMatrix, modelview);

    gl.uniformMatrix3fv(u_normalMatrix, false, normalMatrix);
    gl.uniformMatrix4fv(u_modelview, false, modelview );
    gl.uniformMatrix4fv(u_projection, false, projection );
    gl.drawElements(gl.TRIANGLES, modelData.indices.length, gl.UNSIGNED_SHORT, 0);
}

/*
 * Called and data for the model are copied into the appropriate buffers, and the
 * scene is drawn.
 */
function installModel(modelData) {
    gl.bindBuffer(gl.ARRAY_BUFFER, a_coords_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_coords_loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_coords_loc);
    gl.bindBuffer(gl.ARRAY_BUFFER, a_normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_normal_loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_normal_loc);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
}


/* Initialize the WebGL context.  Called from init() */
function initGL() {
    var prog = createProgram(gl,"vshader-source","fshader-source");
    gl.useProgram(prog);
    a_coords_loc =  gl.getAttribLocation(prog, "a_coords");
    a_normal_loc =  gl.getAttribLocation(prog, "a_normal");
    u_modelview = gl.getUniformLocation(prog, "modelview");
    u_projection = gl.getUniformLocation(prog, "projection");
    u_normalMatrix =  gl.getUniformLocation(prog, "normalMatrix");
    u_lightPosition =  gl.getUniformLocation(prog, "lightPosition");
    u_headlight1Position = gl.getUniformLocation(prog, "headlight1Position");
    u_headlight2Position = gl.getUniformLocation(prog, "headlight2Position");
    u_coneDirection = gl.getUniformLocation(prog, "coneDirection");
    u_diffuseColor =  gl.getUniformLocation(prog, "diffuseColor");
    u_specularColor =  gl.getUniformLocation(prog, "specularColor");
    u_specularExponent = gl.getUniformLocation(prog, "specularExponent");
    u_glowing = gl.getUniformLocation(prog, "glowing");
    u_shiny = gl.getUniformLocation(prog, "shiny");
    u_headlights = gl.getUniformLocation(prog, "headlights");
    a_coords_buffer = gl.createBuffer();
    a_normal_buffer = gl.createBuffer();
    index_buffer = gl.createBuffer();
    gl.enable(gl.DEPTH_TEST);
    gl.uniform3f(u_specularColor, 0.5, 0.5, 0.5);
    gl.uniform4f(u_diffuseColor, 1, 1, 1, 1);
    gl.uniform1f(u_specularExponent, 10);
    gl.uniform4f(u_lightPosition, 0, 0, 0, 1);
    gl.uniform4f(u_headlight1Position, 0, 0, 0, 1);
    gl.uniform4f(u_headlight2Position, 0, 0, 0, 1);
    gl.uniform4f(u_coneDirection, 0, 0, 0, 1);
    gl.uniform1i(u_glowing, 0);
    gl.uniform1i(u_shiny, 0);
    gl.uniform1i(u_headlights, 0);
}

/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type String is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 *    The second and third parameters are the id attributes for <script>
 * elementst that contain the source code for the vertex and fragment
 * shaders.
 */
function createProgram(gl, vertexShaderID, fragmentShaderID) {
    function getTextContent( elementID ) {
        // This nested function retrieves the text content of an
        // element on the web page.  It is used here to get the shader
        // source code from the script elements that contain it.
        var element = document.getElementById(elementID);
        var node = element.firstChild;
        var str = "";
        while (node) {
            if (node.nodeType == 3) // this is a text node
                str += node.textContent;
            node = node.nextSibling;
        }
        return str;
    }
    try {
        var vertexShaderSource = getTextContent( vertexShaderID );
        var fragmentShaderSource = getTextContent( fragmentShaderID );
    }
    catch (e) {
        throw "Error: Could not get shader source code from script elements.";
    }
    var vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vertexShaderSource);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
    }
    var fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
        throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
    }
    var prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
        throw "Link error in program:  " + gl.getProgramInfoLog(prog);
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    try {
        var canvas = document.getElementById("myGLCanvas");
        gl = canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }

    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context:" + e + "</p>";
        return;
    }

    rotator = new TrackballRotator(canvas, draw, 15);
    document.getElementById("animate").checked = true;
    tick();
}

function tick() {
    requestAnimFrame(tick);
    if (document.getElementById("animate").checked)
        draw();
}







