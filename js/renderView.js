creatingView = function(containerId) {

  scope = this;
  var canvasBg = "0xffffff";
  var objectColor = "0xbbbbbb";
  this.containerId  = containerId;
  var container     = document.getElementById(containerId);

    // set the scene size
    var WIDTH = 520,
        HEIGHT = 480;

    // set some camera attributes
    var VIEW_ANGLE = 45,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 50000;

    var camera,
        scene,
        renderer,
        geometry,
        material,
        mesh,
        light1,
        stats,
        reader,
        geo,
        canvasStatus,
        WebGLCheck,
        WebGLStatus,
        loader;

    var fileType = null;

    var STL_ASCII = false,
        STL_BINARY = false,
        PLY_ASCII = false,
        OBJ = false;

    var loader = new THREE.STLLoader();

    function readFile() {
      var files = document.getElementById('stlFile').files;
      var file = files[0];
      var start = 0;
      var stop = file.size - 1;

      reader = new FileReader();

      var fileExt = file.name.split(".").pop();

      if(fileExt == "stl") {
            $("#uploadFile").addClass("hide");
            $("#canvasWrap").show();
            reader.onloadend = function(evt) {
                var tmp = evt.target.result.slice(0,5);
                STL_BINARY = true;
                    var reader = new FileReader();
                      reader.onload = function(evt) {
                            creatingView.init();
                            loader.load(evt.target.result,objectColor);
                        }       
                    var blob = file.slice(start, stop + 1);
                    reader.readAsBinaryString(blob)

                    loader.addEventListener( 'load', function ( event,objectColor ) {

                        var geometry = event.content;

                        var material = new THREE.MeshLambertMaterial( { ambient: 0xbbbbbb, color: 0xbbbbbb } );

                        var mesh = new THREE.Mesh( geometry, material );

                        scene.add( mesh );
                        processDimension(mesh);
                        console.log(mesh.geometry.boundingBox)

                    } );         
            };
            var blob = file.slice(start, stop + 1);
            reader.readAsBinaryString(blob);
      } else if( fileExt == "ply") {
            $("#uploadFile").addClass("hide");
            $("#canvasWrap").show();
            reader.onloadend = function(evt) {
                var tmp = evt.target.result.slice(0,3);
                if(tmp == "ply") {
                    PLY_ASCII = true;
                    creatingView.init();
                    parsePlyASCII(evt.target.result,objectColor);
                    console.log("done");
                } else {
                    console.log("Sorry!!! Ply Binary file not Supported yet")
                }
            };
            var blob = file.slice(start, stop + 1);
            reader.readAsBinaryString(blob);
      } else if( fileExt == "obj") {
            $("#uploadFile").addClass("hide");
            $("#canvasWrap").show();
            reader.onloadend = function(evt) {
                    OBJ = true;
                    creatingView.init();
                    objectLoader(evt.target.result,objectColor);
                    console.log("done");
            };
            var blob = file.slice(start, stop + 1);
            reader.readAsBinaryString(blob);
      }else {
        console.log("File Not Supported yet");
        $(".form-horizontal .alert").removeClass("hide");
        return false;
      }
    }

    // file loader
    $('#stlFile').change(function (e){
        readFile();
        // $("#firstStep").addClass("fileUploaded");
    });

    this.canvasBgColor = function(canvasBg) {
        if(container.innerHTML.length) {
            renderer.setClearColor(canvasBg, 1);
        } else {
            console.log("Error");
        }
    }

    var parsePlyASCII = function (data,objectColor) {

        var geometry = new THREE.Geometry();

        var result;

        var patternHeader = /ply([\s\S]*)end_header/;
        var header = "";
        if ( ( result = patternHeader.exec( data ) ) != null ) {
            header = result [ 1 ];
        }

        var patternBody = /end_header([\s\S]*)$/;
        var body = "";
        if ( ( result = patternBody.exec( data ) ) != null ) {
            body = result [ 1 ];
        }

        var patternVertexCount = /element[\s]+vertex[\s]+(\d+)/g;
        var vertexCount = 0;
        if ( ( result = patternVertexCount.exec( header ) ) != null ) {
            vertexCount = parseInt( result[ 1 ] );
        }

        var patternFaceCount = /element[\s]+face[\s]+(\d+)/g;
        var faceCount = 0;
        if ( ( result = patternFaceCount.exec( header ) ) != null ) {
            faceCount = parseInt( result[ 1 ] );
        }

        if ( vertexCount != 0 && faceCount != 0 ) {
            var patternVertex = /([-+]?[0-9]+\.?[0-9]*([eE][-+]?[0-9]+)?)+[\s]+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)+[\s]+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)+/g;
            for ( var i = 0; i < vertexCount; i++) {
                if ( ( result = patternVertex.exec( body ) ) != null ) {
                    geometry.vertices.push( new THREE.Vector3( parseFloat( result[ 1 ] ), parseFloat( result[ 3 ] ), parseFloat( result[ 5 ] ) ) );
                } else {
                    console.error('Vertex error: vertex count mismatch.');
                    return geometry;
                }
            }
            var patternFace = /3[\s]+([-+]?[0-9]+)[\s]+([-+]?[0-9]+)[\s]+([-+]?[0-9]+)/g;
            for (var i = 0; i < faceCount; i++) {
                if ( ( result = patternFace.exec( body ) ) != null ) {
                    geometry.faces.push( new THREE.Face3( parseInt( result[ 1 ] ), parseInt( result[ 2 ] ), parseInt( result[ 3 ] ) ) );
                } else {
                    console.error('Face error: vertex count mismatch.');
                    return geometry;
                }
            }

        } else {
            console.error( 'Header error: vertexCount(' + vertexCount + '), faceCount(' + faceCount + ').' );
        }

        // geometry.computeCentroids();
        geometry.computeBoundingSphere();
        mesh = new THREE.Mesh( 
                geometry, 
                new THREE.MeshLambertMaterial({
                    ambient: objectColor
                }
            ));
        mesh.position.set( 0, - 0.25, 0 );
        mesh.rotation.set( 0, - Math.PI / 2, 0 );
        scene.add( new THREE.AmbientLight( objectColor ) );

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add( mesh );
        // calling processDimension function
        processDimension(mesh);
        
        // centroid calculations
            var x = 0,
                y = 0,
                z = 0;
            for (var i = 0; i <= mesh.geometry.vertices.length; i++) {
                x += parseInt( (mesh.geometry.vertices[0].x) );
                y += parseInt( (mesh.geometry.vertices[0].y) );
                z += parseInt( (mesh.geometry.vertices[0].z) );
            };
            console.log(x/mesh.geometry.vertices.length);
            console.log(y/mesh.geometry.vertices.length);
            console.log(z/mesh.geometry.vertices.length);
    }

    var objectLoader = function ( text , objectColor) {
        function vector( x, y, z ) {

            return new THREE.Vector3( parseFloat( x ), parseFloat( y ), parseFloat( z ) );

        }

        function uv( u, v ) {

            return new THREE.Vector2( parseFloat( u ), parseFloat( v ) );

        }

        function face3( a, b, c, normals ) {

            return new THREE.Face3( a, b, c, normals );

        }
        
        object = new THREE.Object3D();

        function parseVertexIndex( index ) {

            index = parseInt( index );

            return index >= 0 ? index - 1 : index + vertices.length;

        }

        function parseNormalIndex( index ) {

            index = parseInt( index );

            return index >= 0 ? index - 1 : index + normals.length;

        }

        function parseUVIndex( index ) {

            index = parseInt( index );

            return index >= 0 ? index - 1 : index + uvs.length;

        }
        
        function add_face( a, b, c, normals_inds ) {

            if ( normals_inds === undefined ) {

                geometry.faces.push( face3(
                    vertices[ parseVertexIndex( a ) ] - 1,
                    vertices[ parseVertexIndex( b ) ] - 1,
                    vertices[ parseVertexIndex( c ) ] - 1
                ) );

            } else {

                geometry.faces.push( face3(
                    vertices[ parseVertexIndex( a ) ] - 1,
                    vertices[ parseVertexIndex( b ) ] - 1,
                    vertices[ parseVertexIndex( c ) ] - 1,
                    [
                        normals[ parseNormalIndex( normals_inds[ 0 ] ) ].clone(),
                        normals[ parseNormalIndex( normals_inds[ 1 ] ) ].clone(),
                        normals[ parseNormalIndex( normals_inds[ 2 ] ) ].clone()
                    ]
                ) );

            }

        }
        
        function add_uvs( a, b, c ) {
      
            geometry.faceVertexUvs[ 0 ].push( [
                uvs[ parseUVIndex( a ) ].clone(),
                uvs[ parseUVIndex( b ) ].clone(),
                uvs[ parseUVIndex( c ) ].clone()
            ] );

        }
        
        function handle_face_line(faces, uvs, normals_inds) {

            if ( faces[ 3 ] === undefined ) {
                
                add_face( faces[ 0 ], faces[ 1 ], faces[ 2 ], normals_inds );
                
                if ( uvs !== undefined && uvs.length > 0 ) {

                    add_uvs( uvs[ 0 ], uvs[ 1 ], uvs[ 2 ] );

                }

            } else {
                
                if ( normals_inds !== undefined && normals_inds.length > 0 ) {

                    add_face( faces[ 0 ], faces[ 1 ], faces[ 3 ], [ normals_inds[ 0 ], normals_inds[ 1 ], normals_inds[ 3 ] ] );
                    add_face( faces[ 1 ], faces[ 2 ], faces[ 3 ], [ normals_inds[ 1 ], normals_inds[ 2 ], normals_inds[ 3 ] ] );

                } else {

                    add_face( faces[ 0 ], faces[ 1 ], faces[ 3 ] );
                    add_face( faces[ 1 ], faces[ 2 ], faces[ 3 ] );

                }
                
                if ( uvs !== undefined && uvs.length > 0 ) {

                    add_uvs( uvs[ 0 ], uvs[ 1 ], uvs[ 3 ] );
                    add_uvs( uvs[ 1 ], uvs[ 2 ], uvs[ 3 ] );

                }

            }
            
        }

        // create mesh if no objects in text

        if ( /^o /gm.test( text ) === false ) {

            geometry = new THREE.Geometry();
            material = new THREE.MeshLambertMaterial();
            mesh = new THREE.Mesh( geometry, material );
            object.add( mesh );

        }

        var vertices = [];
        var normals = [];
        var uvs = [];

        // v float float float

        var vertex_pattern = /v( +[\d|\.|\+|\-|e]+)( +[\d|\.|\+|\-|e]+)( +[\d|\.|\+|\-|e]+)/;

        // vn float float float

        var normal_pattern = /vn( +[\d|\.|\+|\-|e]+)( +[\d|\.|\+|\-|e]+)( +[\d|\.|\+|\-|e]+)/;

        // vt float float

        var uv_pattern = /vt( +[\d|\.|\+|\-|e]+)( +[\d|\.|\+|\-|e]+)/;

        // f vertex vertex vertex ...

        var face_pattern1 = /f( +-?\d+)( +-?\d+)( +-?\d+)( +-?\d+)?/;

        // f vertex/uv vertex/uv vertex/uv ...

        var face_pattern2 = /f( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))?/;

        // f vertex/uv/normal vertex/uv/normal vertex/uv/normal ...

        var face_pattern3 = /f( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))?/;

        // f vertex//normal vertex//normal vertex//normal ... 

        var face_pattern4 = /f( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))?/

        //

        var lines = text.split( '\n' );

        for ( var i = 0; i < lines.length; i ++ ) {

            var line = lines[ i ];
            line = line.trim();

            var result;

            if ( line.length === 0 || line.charAt( 0 ) === '#' ) {

                continue;

            } else if ( ( result = vertex_pattern.exec( line ) ) !== null ) {

                // ["v 1.0 2.0 3.0", "1.0", "2.0", "3.0"]

                vertices.push( 
                    geometry.vertices.push(
                        vector(
                            result[ 1 ], result[ 2 ], result[ 3 ]
                        )
                    )
                );

            } else if ( ( result = normal_pattern.exec( line ) ) !== null ) {

                // ["vn 1.0 2.0 3.0", "1.0", "2.0", "3.0"]

                normals.push(
                    vector(
                        result[ 1 ], result[ 2 ], result[ 3 ]
                    )
                );

            } else if ( ( result = uv_pattern.exec( line ) ) !== null ) {

                // ["vt 0.1 0.2", "0.1", "0.2"]

                uvs.push(
                    uv(
                        result[ 1 ], result[ 2 ]
                    )
                );

            } else if ( ( result = face_pattern1.exec( line ) ) !== null ) {

                // ["f 1 2 3", "1", "2", "3", undefined]

                handle_face_line(
                    [ result[ 1 ], result[ 2 ], result[ 3 ], result[ 4 ] ]
                );

            } else if ( ( result = face_pattern2.exec( line ) ) !== null ) {

                // ["f 1/1 2/2 3/3", " 1/1", "1", "1", " 2/2", "2", "2", " 3/3", "3", "3", undefined, undefined, undefined]
                
                handle_face_line(
                    [ result[ 2 ], result[ 5 ], result[ 8 ], result[ 11 ] ], //faces
                    [ result[ 3 ], result[ 6 ], result[ 9 ], result[ 12 ] ] //uv
                );

            } else if ( ( result = face_pattern3.exec( line ) ) !== null ) {

                // ["f 1/1/1 2/2/2 3/3/3", " 1/1/1", "1", "1", "1", " 2/2/2", "2", "2", "2", " 3/3/3", "3", "3", "3", undefined, undefined, undefined, undefined]

                handle_face_line(
                    [ result[ 2 ], result[ 6 ], result[ 10 ], result[ 14 ] ], //faces
                    [ result[ 3 ], result[ 7 ], result[ 11 ], result[ 15 ] ], //uv
                    [ result[ 4 ], result[ 8 ], result[ 12 ], result[ 16 ] ] //normal
                );

            } else if ( ( result = face_pattern4.exec( line ) ) !== null ) {

                // ["f 1//1 2//2 3//3", " 1//1", "1", "1", " 2//2", "2", "2", " 3//3", "3", "3", undefined, undefined, undefined]

                handle_face_line(
                    [ result[ 2 ], result[ 5 ], result[ 8 ], result[ 11 ] ], //faces
                    [ ], //uv
                    [ result[ 3 ], result[ 6 ], result[ 9 ], result[ 12 ] ] //normal
                );

            } else if ( /^o /.test( line ) ) {

                geometry = new THREE.Geometry();
                material = new THREE.MeshLambertMaterial();

                mesh = new THREE.Mesh( geometry, material );
                mesh.name = line.substring( 2 ).trim();
                object.add( mesh );

            } else if ( /^g /.test( line ) ) {

                // group

            } else if ( /^usemtl /.test( line ) ) {

                // material

                material.name = line.substring( 7 ).trim();

            } else if ( /^mtllib /.test( line ) ) {

                // mtl file

            } else if ( /^s /.test( line ) ) {

                // smooth shading

            } else {

                // console.log( "THREE.OBJLoader: Unhandled line " + line );

            }

        }

        var children = object.children;

        for ( var i = 0, l = children.length; i < l; i ++ ) {

            var geometry = children[ i ].geometry;

            geometry.computeFaceNormals();
            geometry.computeBoundingSphere();

        }
        object.children[0].material.color.setHex( objectColor );
        scene.add( object );
        
        
        // calling processDimension function
        processDimension(mesh);

        // object.rotation.x = 5;
        // object.rotation.z = .25;
        // console.log( object )
        // console.log("boundingSphere ----- ");
        // console.log(object.children[0].geometry.boundingSphere.radius);
    }


    // values in console log 
    function processDimension( object ) {
        console.log('\n\n\n'+"%c Calculated Dimensions ", 'background: #222; font-size: 16px; color: #bada55'+'\n');
        calculateDimensions(object)
        calculateVolume(object);

        console.log("Bound Radius: "+object.boundRadius);
        console.log("Bounding Box: ");
        console.log(object.geometry.boundingBox);
        // console.log("Bounding Box: "+'\n'+
        //             "max x: "+object.geometry.boundingBox.max.x+
        //             "max y: "+object.geometry.boundingBox.max.y+
        //             "max z: "+object.geometry.boundingBox.max.z
        //             );
        // console.log(object.geometry.boundingBox);
    }

    // calculate Dimensions
        function calculateDimensions(_object) {
            var absoluteMinX = 0, absoluteMaxX = 0, absoluteMinY = 0, absoluteMaxY = 0, absoluteMinZ = 0, absoluteMaxZ = 0;

            for (var i = 0; i < _object.children.length; i++) {
                _object.children[i].geometry.computeBoundingBox();
                // console.log(_object.children[i].geometry.computeBoundingBox())
                absoluteMinX = Math.min(absoluteMinX,_object.children[i].geometry.boundingBox.min.x);
                absoluteMaxX = Math.max(absoluteMaxX,_object.children[i].geometry.boundingBox.max.x);
                absoluteMinY = Math.min(absoluteMinY,_object.children[i].geometry.boundingBox.min.y);
                absoluteMaxY = Math.max(absoluteMaxY,_object.children[i].geometry.boundingBox.max.y);
                absoluteMinZ = Math.min(absoluteMinZ,_object.children[i].geometry.boundingBox.min.z);
                absoluteMaxZ = Math.max(absoluteMaxZ,_object.children[i].geometry.boundingBox.max.z);
            }

            // set generic height and width values
            _object.depth = (absoluteMaxX - absoluteMinX) * _object.scale.x;
            _object.height = (absoluteMaxY - absoluteMinY) * _object.scale.y;
            _object.width = (absoluteMaxZ - absoluteMinZ) * _object.scale.z;

            // remember the original dimensions
            if (_object.originalDepth === undefined) _object.originalDepth = _object.depth;
            if (_object.originalHeight === undefined) _object.originalHeight = _object.height;
            if (_object.originalWidth === undefined) _object.originalWidth = _object.width;

            console.log("Depth: " + _object.depth + ", Height: " + _object.height + ", Width: " + _object.width);
        }
    
    // calculate volume
        function volumeOfT(p1, p2, p3){
            var v321 = p3.x*p2.y*p1.z;
            var v231 = p2.x*p3.y*p1.z;
            var v312 = p3.x*p1.y*p2.z;
            var v132 = p1.x*p3.y*p2.z;
            var v213 = p2.x*p1.y*p3.z;
            var v123 = p1.x*p2.y*p3.z;
            return (-v321 + v231 + v312 - v132 - v213 + v123)/6.0;
        }

        function calculateVolume(object){
            var volumes = 0.0;
            for(var i = 0; i < object.geometry.faces.length; i++){
                var Pi = object.geometry.faces[i].a;
                var Qi = object.geometry.faces[i].b;
                var Ri = object.geometry.faces[i].c;

                var P = new THREE.Vector3(object.geometry.vertices[Pi].x, object.geometry.vertices[Pi].y, object.geometry.vertices[Pi].z);
                var Q = new THREE.Vector3(object.geometry.vertices[Qi].x, object.geometry.vertices[Qi].y, object.geometry.vertices[Qi].z);
                var R = new THREE.Vector3(object.geometry.vertices[Ri].x, object.geometry.vertices[Ri].y, object.geometry.vertices[Ri].z);
                volumes += volumeOfT(P, Q, R);
            }

            loadedObjectVolume = Math.abs(volumes) / 1000;
            console.log("Volume: "+loadedObjectVolume);
            if(loadedObjectVolume > 40000){
                // mesh.position.set(0,0,500);
                // console.log(mesh.position)
                mesh.scale.set( .03, .03, .03 );
                // render();
            } else if ( loadedObjectVolume > 30000 ) {
                mesh.scale.set( .09, .09, .09 );
            } 
            // else if ( loadedObjectVolume > 1200 ) {
            //     mesh.scale.set( .06, .06, .06 );
            // }
        }

    $(container).hover(
        function(){
            // mousewheel controller
            window.addEventListener('DOMMouseScroll', mousewheel, true);
            window.addEventListener('mousewheel', mousewheel, true);
        }, function() {
            window.removeEventListener('DOMMouseScroll', mousewheel, true);
            window.removeEventListener('mousewheel', mousewheel, true);
        }
    )

    $(container).on({
        'mousewheel': function(e) {
            if (e.target.id == 'el') return;
            e.preventDefault();
            e.stopPropagation();
        }
    })

    function mousewheel(event) {

        var fovMAX = 100;
        var fovMIN = 1;

        camera.fov -= event.wheelDeltaY * 0.05;
        camera.fov = Math.max( Math.min( camera.fov, fovMAX ), fovMIN );
        camera.projectionMatrix = new THREE.Matrix4().makePerspective(camera.fov, WIDTH/HEIGHT, NEAR, FAR);
    }

    // light function
    function addLight() {
        // add directionalLight
        var directionalLight = new THREE.DirectionalLight( 0xffffff,.5 );
        directionalLight.position.set(350,225,280);
        directionalLight.position.normalize();
        scene.add( directionalLight );

        var directionalLight1 = new THREE.DirectionalLight( 0xffffff,.5 );
        directionalLight1.position.set(-360,240,-390);
        directionalLight1.position.normalize();
        scene.add( directionalLight1 );


        // add spotlight for a bit of light
        var spotLight0 = new THREE.SpotLight(0xffffff,.9);
        spotLight0.position.set(0, 500, 500);
        scene.add(spotLight0);

        var spotLight1 = new THREE.SpotLight(0xffffff,.9);
        spotLight1.position.set(0, -500, -500);
        scene.add(spotLight1);


        // FLOOR
        // console.log(floor)
        // floor.rotation.x = Math.PI / 2;
        // floor.rotation.z = 3;

        // var floorMaterial = new THREE.MeshBasicMaterial( { color: 0x888888, opacity: 0.6 } );
        // var floorGeometry = new THREE.PlaneGeometry(400, 400, 10, 10);
        // var floor = new THREE.Mesh(floorGeometry, floorMaterial);
        // floor.rotation.set(0,0,0)
        // scene.add(floor);
    }

    function createScene() {
        camera = new THREE.PerspectiveCamera(VIEW_ANGLE,ASPECT,NEAR,FAR);
        camera.position.set( 900,300,800);
        scene = new THREE.Scene();
        // console.log(camera)
        scene.add( camera );
        // var axisHelper = new THREE.AxisHelper( 2 );
        // scene.add( axisHelper );
    }

    function addControls() {
        // Add OrbitControls so that we can pan around with the mouse.
        controls = new THREE.OrbitControls(camera,container);
    }

    function addingView() {
        // get the DOM element to attach to
        var $container = $(container);
        canvasStatus = document.createElement("canvas");
        WebGLCheck = canvasStatus.getContext("experimental-webgl");
        WebGLStatus = WebGLCheck instanceof WebGLRenderingContext;
        if (WebGLStatus) {
            renderer = new THREE.WebGLRenderer({ antialias: true });
        } else {
            renderer = new THREE.CanvasRenderer();
        }
        renderer.setClearColorHex(0xe1e1e1, 1);
        renderer.setSize(WIDTH, HEIGHT);
        renderer.domElement.setAttribute("id", "canvas");
        $container.append(renderer.domElement);
    }

    this.init = function() {

        // creating a  scene
        createScene();

        // adding controlls
        addControls();


        // adding lights 
        addLight();
        
        addingView();            
        
        animate();

    }

    function animate() {
        requestAnimationFrame( animate );
        controls.update();
        render();
    }

    function render() {
        renderer.render( scene, camera );
        controls.update();
    }

    this.objectColor = function(objectColor) {
        if( STL_BINARY == true ) {
            console.clear();
            scene.remove(mesh);
            parseStlBinary(reader.result,objectColor);
        } else if ( STL_ASCII == true) {
            console.clear();
            scene.remove(mesh);
            parseASCII(reader.result,objectColor);
        } else if( PLY_ASCII ==  true ) {
            console.clear();
            scene.remove(mesh);
            parsePlyASCII(reader.result,objectColor);
        } else if( OBJ == true ) {
            console.clear();
            scene.remove(object);
            objectLoader(reader.result,objectColor);
        }else {
            console.log("Error");
        }
        $(".updatingObject").fadeOut(600);
    }
}