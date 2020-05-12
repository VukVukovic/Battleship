const N = 10;
const ALLOWED_SHIPS = {1 : 4, 2 : 3, 3 : 2, 4 : 1};

function generateTable() {
    let playerTable = $('<div>').addClass('grid noselect').css('grid-template-columns', '0.5fr ' + '1fr '.repeat(N))
                                .css('grid-template-rows', '0.5fr ' + '1fr '.repeat(N));;

    playerTable.append($('<div>').addClass('grid-label'));
    for (let j = 0; j < N; j++) {
        let char = String.fromCharCode('A'.charCodeAt(0) + j);
        playerTable.append($('<div>').addClass('grid-label font-oswald h6').text(char));
    }

    for (let i = 0; i < N; i++) {
        playerTable.append($('<div>').addClass('grid-label font-oswald h6').text(i+1));
        for (let j = 0; j < N; j++) {
            playerTable.append($('<div>').addClass('grid-field card'));
        }
    }

    return playerTable;  
}

function mapFields(tableId) {
    let map = [];
    for (let i = 0; i < N; i++)
        map[i] = [];

    let i = 0, j = 0;
    $(tableId + ' .grid-field').each(function() {
        map[i][j] = $(this);
        j++;
        if (j == N) {
            j = 0;
            i++;
        }
    });
    return map;
}

function printTable(matrix, map, my) {
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            map[i][j].removeClass('water ship-1 ship-2 ship-3 ship-4 hidden-field ship-unknown');
            map[i][j].html('');

            let cls = '', content = '';

            if (my) {
                if (matrix[i][j].flooded)
                    content = '<i class="fas fa-times text-white"></i>'

                if (matrix[i][j].ship == null)
                    cls = 'water';
                else
                    cls = 'ship-' + matrix[i][j].ship.len;

                if (matrix[i][j].flooded && matrix[i][j].ship != null 
                	&& matrix[i][j].ship.flooded == matrix[i][j].ship.len)
                	content = '<i class="fas fa-times text-darker"></i>';
            }
            else {
                cls = 'hidden-field';

                if (matrix[i][j].flooded) {
                    if (matrix[i][j].ship == null)
                        cls = 'water';
                    else if (matrix[i][j].ship.flooded == matrix[i][j].ship.len)
                        cls = 'ship-' + matrix[i][j].ship.len;
                    else
                        cls = 'ship-unknown';
                }
            }
            
            map[i][j].addClass(cls);
            map[i][j].html(content)
        }
    }
}

function ships2Matrix(ships) {
    let matrix = nullMatrix(N);
    for (let m = 0; m < ships.length; m++) {
        let ship = ships[m];
        let i = ship.i;
        let j = ship.j;
    
        for (let k = 0; k < ship.len; k++) {
            matrix[i][j].ship = ship;
            
            i += ship.di;
            j += ship.dj;
        }
    }
    return matrix;
}

function nullMatrix(n) {
    let matrix = [];
    for (let i = 0; i < n; i++) {
        matrix[i] = [];
        for (let j=0; j<n; j++) {
            matrix[i][j] = {ship : null, flooded: false};
        }
    }
    return matrix;
} 

function addFields(ships) {
    for (let i = 0; i < ships.length; i++) {
        ships[i].flooded = 0;
    }
}

function index2IJ(index) {
    let i = Math.floor(index / (N+1)) - 1;
    let j = index % (N+1) - 1;
    return {i: i, j : j};
}

function checkWin(ships) {
    for (let i = 0; i < ships.length; i++) {
        if (ships[i].flooded < ships[i].len)
            return false;
    }

    return true;
}

var canPlay = true;

function printInfo(text, doNotBlock=false) {
    if (!doNotBlock)
        canPlay = false;
    $('#info').text(text).fadeIn();
    setTimeout(() => {
        $('#info').fadeOut();
        if (!doNotBlock)
            canPlay = true;
    }, 700);
}

function endGame(winner, ships) {
    $('#win-modal .modal-title').text(winner + ' won the game!');
    let left = Object.assign({}, ALLOWED_SHIPS);
    for (let i = 0; i < ships.length; i++) {
        if (ships[i].len == ships[i].flooded)
            left[ships[i].len]--;
    }

    let text = 'Ships that were not flooded: <br/>';
    for (let ship_size in left) {
        text += 'Ship of size ' + ship_size + ': ' + left[ship_size] + '<br />';
    }
    
    $('#win-modal .modal-body').html(text);
    $('#win-modal').modal('show');

    window.localStorage.setItem('players', null);
    window.localStorage.setItem('ships', null);
}

$(function() {

    let players = JSON.parse(window.localStorage.getItem('players'));

    $('#player0').text(players[0]);
    $('#player1').text(players[1]);

    let ships = JSON.parse(window.localStorage.getItem('ships'));
    console.log(ships);

    let myTable = generateTable();
    $('#my-table').append(myTable);

    let oponentTable = generateTable();
    $('#opponent-table').append(oponentTable);

    let myMap = mapFields('#my-table');
    let opponentMap = mapFields('#opponent-table');

    addFields(ships[0]);
    addFields(ships[1]);

    let matrix = [ships2Matrix(ships[0]), ships2Matrix(ships[1])];

    let curP = 0;
    let canPlay = true;

    printTable(matrix[0], myMap, true);
    printTable(matrix[1], opponentMap, false);
    $('#player' + (1-curP)).parent().removeClass('text-white');
    $('#player' + curP).parent().addClass('text-white');

    $('#opponent-table .grid-field').click(function() {
        if (!canPlay) return;

        let indexes = index2IJ($(this).index());
        let i = indexes.i; 
        let j = indexes.j;
        
        let field = matrix[1-curP][i][j];

        if (!field.flooded) {
            field.flooded = true;
            if (field.ship != null) {
                field.ship.flooded++;
                if (field.ship.flooded == field.ship.len) {
                    if (checkWin(ships[1-curP]))
                        endGame(players[curP], ships[curP]);
                    printInfo('Ship of size ' + field.ship.len + ' flooded!');
                }
                else
                    printInfo('Hit! Shoot again!');
            } else {
                canPlay = false;
                printInfo('Miss! Other player\'s turn!', true);
                setTimeout(() => {
                    curP = 1-curP;
                    printTable(matrix[curP], myMap, true);
                    printTable(matrix[1-curP], opponentMap, false);
                    $('#player' + (1-curP)).parent().removeClass('text-white');
                    $('#player' + curP).parent().addClass('text-white');
                    canPlay = true;
                }, 1500);
            }
            printTable(matrix[1-curP], opponentMap, false);
        } else {
            printInfo('Field already flooded!');
        }
    });
});