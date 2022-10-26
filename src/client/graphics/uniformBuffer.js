const UniformBuffer = (function()  {

  // gl:WebGL2RenderingContext, program:WebGLProgram, variableNames:String[], uniformBlockName:String, bindIndex:Number
  function UniformBuffer(gl, program, variableNames, uniformBlockName, bindIndex = 0) {
    this.gl = gl;

    const blockIndex = gl.getUniformBlockIndex(program, uniformBlockName);
    const blockSize = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE);

    const buffer = this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
    gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, bindIndex, buffer);

    const variableIndices = gl.getUniformIndices(program, variableNames);
    const variableOffsets = gl.getActiveUniforms(program, variableIndices, gl.UNIFORM_OFFSET);

    this.variableInfo = {};
    variableNames.forEach((name, index) => {
      this.variableInfo[name] = {
        index:  variableIndices[index],
        offset: variableOffsets[index]
      };
    });

    const uniformBlockIndex = gl.getUniformBlockIndex(program, uniformBlockName);
    gl.uniformBlockBinding(program, uniformBlockIndex, bindIndex);
  }

  // variable:String, data:Any
  UniformBuffer.prototype.updateVariable = function(variableName, ...data) {
    const gl = this.gl;
    this.gl.bufferSubData(
      gl.UNIFORM_BUFFER,
      this.variableInfo[variableName].offset,
      typeof data[0] === 'object' ? data[0] : new Float32Array(data),
      0);
  };

  // updates everything
  UniformBuffer.prototype.update = function() {};

  UniformBuffer.prototype.bind = function() {
    const gl = this.gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
  };

  UniformBuffer.prototype.unbind = function() {
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  };

  return UniformBuffer;

})();