let board = null;
let game = new Chess();
let moveIndex = 0;
let moves = [];
let comments = {};
let lastMove = null;

async function loadGameData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const compressed = urlParams.get('data');
        
        if (compressed) {
            // 압축 해제 먼저 수행
            const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
            if (!decompressed) {
                console.error('Failed to decompress data');
                return;
            }
            
            // 압축 해제된 데이터를 JSON으로 파싱
            const gameData = JSON.parse(decompressed);
            
            game.load_pgn(gameData.pgn);
            moves = gameData.moves;
            comments = gameData.comments;
            game.reset();
            updateDisplay();
        }
    } catch (error) {
        console.error('Error loading game data:', error);
    }
}

function highlightSquares(from, to) {
    // 모든 이전 하이라이트 제거
    if (lastMove) {
        $(`#board .square-${lastMove.from}`).css('background-color', '');
        $(`#board .square-${lastMove.to}`).css('background-color', '');
    }
    // 이전 체크 하이라이트도 제거
    const prevKingSquare = findKingSquare('w');
    const prevOppKingSquare = findKingSquare('b');
    if (prevKingSquare) $(`#board .square-${prevKingSquare}`).css('background-color', '');
    if (prevOppKingSquare) $(`#board .square-${prevOppKingSquare}`).css('background-color', '');

    // 현재 수의 평가 확인 (이동하려는 수를 확인)
    const currentMove = moves.find(move => move.from === from && move.to === to);
    const isExcellent = currentMove && currentMove.san.includes('!!');
    const isBlunder = currentMove && currentMove.san.includes('?');
    
    // 이동 경로 하이라이트
    if (isExcellent) {
        // 탁월한 수는 옅은 하늘색으로 표시
        $(`#board .square-${from}`).css('background-color', '#90caf9');
        $(`#board .square-${to}`).css('background-color', '#90caf9');
    } else {
        // 일반적인 수는 옅은 노란색으로 표시
        $(`#board .square-${from}`).css('background-color', '#fff59d');
        $(`#board .square-${to}`).css('background-color', '#fff59d');
    }

    // 체크 상태 확인
    if (game.in_check()) {
        const kingSquare = findKingSquare(game.turn());
        if (kingSquare) {
            $(`#board .square-${kingSquare}`).css('background-color', '#ef9a9a');
        }
    }

    lastMove = { from, to };
}

// 현재 차례의 킹 위치 찾기
function findKingSquare(color) {
    const board = game.board();
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece && piece.type === 'k' && piece.color === color) {
                const files = 'abcdefgh';
                const ranks = '87654321';
                return files[j] + ranks[i];
            }
        }
    }
    return null;
}

function updateDisplay() {
    const moveNumberDiv = document.getElementById('move-number');
    const moveNotation = moveIndex > 0 ? moves[moveIndex - 1].san : '';
    const moveNumber = Math.floor((moveIndex + 1) / 2);
    const isWhite = moveIndex % 2 === 1;
    
    const moveText = moveIndex > 0 
        ? `${moveNumber}${isWhite ? '.' : '...'} ${moveNotation}`
        : '';
    
    moveNumberDiv.textContent = moveText;

    const commentDiv = document.getElementById('comment');
    const comment = comments[moveIndex] || '';
    commentDiv.textContent = comment;
}

// 다음 수 진행
function nextMove() {
    if (moveIndex < moves.length) {
        const move = moves[moveIndex];
        game.move(move);
        board.position(game.fen());
        highlightSquares(move.from, move.to);
        moveIndex++;
        updateDisplay();
    }
}

// 이전 수로 되돌리기
function prevMove() {
    if (moveIndex > 0) {
        moveIndex--;
        game.undo();
        board.position(game.fen());
        
        if (moveIndex > 0) {
            const prevMove = moves[moveIndex - 1];
            highlightSquares(prevMove.from, prevMove.to);
        } else {
            if (lastMove) {
                $(`#board .square-${lastMove.from}`).css('background-color', '');
                $(`#board .square-${lastMove.to}`).css('background-color', '');
                lastMove = null;
            }
        }
        updateDisplay();
    }
}

// 첫 수로 돌아가기
function goToStart() {
    while (moveIndex > 0) {
        moveIndex--;
        game.undo();
    }
    board.position(game.fen());
    
    if (lastMove) {
        $(`#board .square-${lastMove.from}`).css('background-color', '');
        $(`#board .square-${lastMove.to}`).css('background-color', '');
        lastMove = null;
    }
    
    updateDisplay();
}

// 마지막 수로 가기
function goToEnd() {
    while (moveIndex < moves.length) {
        const move = moves[moveIndex];
        game.move(move);
        moveIndex++;
    }
    board.position(game.fen());
    
    if (moves.length > 0) {
        const lastMove = moves[moves.length - 1];
        highlightSquares(lastMove.from, lastMove.to);
    }
    
    updateDisplay();
}

// 키보드 이벤트 처리
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        prevMove();
    } else if (e.key === 'ArrowRight') {
        nextMove();
    } else if (e.key === 'ArrowUp') {
        goToStart();
    } else if (e.key === 'ArrowDown') {
        goToEnd();
    }
});

window.onload = function() {
    board = Chessboard('board', {
        position: 'start',
        draggable: false,
        pieceTheme: './img/chesspieces/wikipedia/{piece}.png'
    });

    // 버튼 이벤트 리스너 추가
    document.getElementById('next').addEventListener('click', nextMove);
    document.getElementById('prev').addEventListener('click', prevMove);

    loadGameData();
}