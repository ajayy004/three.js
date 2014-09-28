var WEB_GL_STATE = {
	SUPPORTED : 1,
	NOT_SUPPORTED : -1,
	DISABLED : 0
}

var check_webGL = function(){
    if (!!window.WebGLRenderingContext) {
        var canvas = document.createElement("canvas"),
             names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
           context = false;
        for(var i=0;i<4;i++) {
            
                context = canvas.getContext(names[i]);
                if (context && typeof context.getParameter == "function") {
                    return WEB_GL_STATE.SUPPORTED;
                }            
        }
        return WEB_GL_STATE.DISABLED;
    }    
    return WEB_GL_STATE.NOT_SUPPORTED;
}