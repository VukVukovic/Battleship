$(function(){
    $('#formPlayers').submit(function(e){
        let players = {
            0: $('#player0').val(),
            1: $('#player1').val()
        };
        console.log(players);
        window.localStorage.setItem('players', JSON.stringify(players));
    });
});