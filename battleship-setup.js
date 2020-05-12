const N = 10;
const ALLOWED_SHIPS = {1 : 4, 2 : 3, 3 : 2, 4 : 1};
const MIN_SHIP = 1, MAX_SHIP = 4;

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

function index2IJ(index) {
    let i = Math.floor(index / (N+1)) - 1;
    let j = index % (N+1) - 1;
    return {i: i, j : j};
}

function makeShip(i0, j0, i1, j1) {
    let len = Math.abs(i0-i1)+Math.abs(j0-j1)+1;

    if ((i0 != i1 && j0 != j1) || (len < MIN_SHIP) || len > MAX_SHIP)
        return null;

    let di = 0, dj = 1;
    let i = i0, j = Math.min(j0, j1);
    if (j0 == j1) {
        di = 1; dj = 0;
        i = Math.min(i0, i1); j = j0;
    }

    return  {i:i, j:j, di:di, dj:dj, len:len}
}

function validField(i, j) {
    return (i>=0) && (i<N) && (j>=0) && (j<N);
}

function checkSurrounding(playerShips, i, j) {
    for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
            if (validField(i+di, j+dj) && playerShips[i+di][j+dj]!=0)
                return false;
        }
    }
    return true;
}

function checkNewShip(ship, playerShips) {
    let i = ship.i;
    let j = ship.j;

    for (let k = 0; k < ship.len; k++) {
        if (!checkSurrounding(playerShips, i, j))
            return false;
        
        i += ship.di;
        j += ship.dj;
    }
    return true;
}

function putShip(ship, playerShips, tableMap) {
    console.log("Putting ship! " + ship.len);
    let i = ship.i;
    let j = ship.j;

    for (let k = 0; k < ship.len; k++) {
        console.log("Putting");
        playerShips[i][j] = ship.len;
        tableMap[i][j].addClass('ship-'+ship.len);
        console.log("Putting " + i + " " + j)
        
        i += ship.di;
        j += ship.dj;
    }
}

function clearSelected(map) {
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            map[i][j].removeClass('selected');
        }
    }
}

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
            playerTable.append($('<div>').addClass('grid-field card water'));
        }
    }

    return playerTable;  
}

function printLeftShips(leftShips) {
    for (let ship_size in leftShips) {
        let left = leftShips[ship_size];
        $('#left-'+ship_size).text(left + ' x');
    }
}

function printInfo(text) {
    let text_object = $('<div>').text(text);
    text_object.hide();
    $('#info').append(text_object);
    text_object.fadeIn();
    setTimeout(function(){ 
        text_object.fadeOut().remove();
    }, 1500);
}

function zeroMatrix(n) {
    let playerShips = [];
    for (let i = 0; i < n; i++) {
        playerShips[i] = [];
        for (let j=0; j<n; j++) {
            playerShips[i][j] = 0;
        }
    }
    return playerShips;
} 

function clearTable(map) {
    let remove = '';

    for (let ship_size in ALLOWED_SHIPS)
        remove += 'ship-'+ship_size+' ';
    
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            map[i][j].removeClass(remove);
        }
    }
}

function startMove(player, shipsLeft) {
    $('#player' + (1-player)).parent().removeClass('text-white');
    $('#player' + player).parent().addClass('text-white');
    printLeftShips(shipsLeft);
    printInfo($('#player' + player).text() + ', set your ships!');
}

function allShipsUsed(shipsLeft) {
    for (let ship_size in shipsLeft) {
        if (shipsLeft[ship_size] != 0)
            return false;
    }
    return true;
}

function nextStrage(ships) {
    window.localStorage.setItem('ships', JSON.stringify(ships));
    window.location.replace('battleship-game.html');
}

$(function(){
    let players = JSON.parse(window.localStorage.getItem('players'));

    $('#player0').text(players[0]);
    $('#player1').text(players[1]);

    let playerTable = generateTable();
    $('#setup-table').append(playerTable);
    let map = mapFields('#setup-table');

    let curP = 0;
    let playerShips = [zeroMatrix(N), zeroMatrix(N)];
    console.log(playerShips);
    let shipsLeft = [Object.assign({}, ALLOWED_SHIPS), Object.assign({}, ALLOWED_SHIPS)];
    startMove(curP, shipsLeft[curP]);

    let ships = [[],[]];

    let i0, j0, i1, j1, down = false, error = false;
    
    $('#setup-table .grid-field').mousedown(function(){
        let indexes = index2IJ($(this).index());
        i0 = indexes.i; i1 = i0;
        j0 = indexes.j; j1 = j0;
        down = true;
        error = false;
        map[i0][j0].addClass('selected');
    });

    $('#setup-table .grid-field').mouseover(function(){
        if (down) {
            let indexes = index2IJ($(this).index());
            map[indexes.i][indexes.j].addClass('selected');
            i1 = indexes.i; j1 = indexes.j;
            if (indexes.i != i0 && indexes.j != j0)
                error = true;
        }
    });

    $('body').mouseup(function(){
        if (!down) return;

        down = false;
        clearSelected(map);

        if (!error) {
            let ship = makeShip(i0,j0,i1,j1);
            if (ship != null) {
                if (checkNewShip(ship, playerShips[curP])) {
                    if (shipsLeft[curP][ship.len]>0) {
                        ships[curP].push(ship);
                        putShip(ship, playerShips[curP], map);
                        shipsLeft[curP][ship.len]--;
                        printLeftShips(shipsLeft[curP]);

                        if (allShipsUsed(shipsLeft[curP])) {
                            if (curP==0) { 
                                curP++;

                                setTimeout(() => {  
                                    clearTable(map);
                                    startMove(curP, shipsLeft[curP]); 
                                }, 1000);
                            }
                            else { 
                                setTimeout(() => {  
                                    nextStrage(ships);
                                }, 1000);
                            }
                        }
                    } else {
                        printInfo('You have no ships of that size left!');
                    }
                } else {
                    printInfo('Ship cannot be placed there!');
                }
            } else {
                printInfo('Ship size is not valid!');
            }
        } else {
            printInfo('Ship shape is not valid!');
        }
    });
});