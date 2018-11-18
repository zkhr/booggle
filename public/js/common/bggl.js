(function(exports){
  exports.actions = {
    JOIN: 'join',
    ADD_PLAYER: 'addplayer',
    REMOVE_PLAYER: 'rmplayer',
    START: "start",
    END: "end",
    SEND_WORD: "sendword",
    DEFINE: "define"
  };

  exports.states = {
    STOPPED: 0,
    IN_PROGRESS: 1
  };
}(typeof exports === 'undefined' ? this.bggl = {} : exports));
