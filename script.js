let board = null;
let game = new Chess();
let moveIndex = 0;
let moves = [];
let comments = {};
let lastMove = null;

// 주석 저장 기능
function saveComment() {
    const commentInput = document.getElementById('comment-input');
    const newComment = commentInput.value;
    
    if (newComment !== null && newComment.trim() !== '') {
        comments[moveIndex] = newComment;
        updateDisplay();
        commentInput.value = '';
    }
}

function saveGame() {
    const gameData = {
        pgn: document.getElementById('pgn').value,
        comments: comments,
        moves: moves.map(move => ({
            ...move,
            san: move.san
        }))
    };
    
    // LZ-string을 사용한 데이터 압축
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(gameData));
    const viewerUrl = `viewer.html?data=${compressed}`;
    window.open(viewerUrl, '_blank');
}

// 첫 수로 돌아가기
function goToStart() {
    while (moveIndex > 0) {
        moveIndex--;
        game.undo();
    }
    board.position(game.fen());
    
    // 하이라이트 제거
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

// 탁월 표시 토글
function markExcellent() {
    if (moveIndex > 0) {
        const move = moves[moveIndex - 1];
        if (move.san.includes('!!')) {
            move.san = move.san.replace('!!', '');
        } else {
            move.san = move.san + '!!';
        }
        updateDisplay();
    }
}

// 블런더 표시 토글
function markBlunder() {
    if (moveIndex > 0) {
        const move = moves[moveIndex - 1];
        if (move.san.includes('?')) {
            move.san = move.san.replace('?', '');
        } else {
            move.san = move.san + '?';
        }
        updateDisplay();
    }
}

function highlightSquares(from, to) {
    // 이전 하이라이트 제거
    if (lastMove) {
        $(`#board .square-${lastMove.from}`).css('background-color', '');
        $(`#board .square-${lastMove.to}`).css('background-color', '');
    }

    // 새로운 하이라이트 적용 (둘 다 연한 노란색)
    $(`#board .square-${from}`).css('background-color', '#fff59d');
    $(`#board .square-${to}`).css('background-color', '#fff59d');

    // 현재 이동 저장
    lastMove = { from, to };
}

function updateDisplay() {
    // 현재 수 표시 업데이트
    const moveNumberDiv = document.getElementById('move-number');
    const moveNotation = moveIndex > 0 ? moves[moveIndex - 1].san : '';
    const moveNumber = Math.floor((moveIndex + 1) / 2);
    const isWhite = moveIndex % 2 === 1;
    
    const moveText = moveIndex > 0 
        ? `${moveNumber}${isWhite ? '.' : '...'} ${moveNotation}`
        : '';
    
    moveNumberDiv.textContent = moveText;

    // 주석 표시 업데이트
    const commentDiv = document.getElementById('comment');
    const comment = comments[moveIndex] || '';
    commentDiv.textContent = comment;
}

// PGN 로드 및 파싱
function loadPGN() {
    const pgn = document.getElementById('pgn').value;
    game.load_pgn(pgn);
    moves = game.history({ verbose: true });
    moveIndex = 0;
    comments = {};
    game.reset();
    board.position(game.fen());
    updateDisplay();
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
        const move = moves[moveIndex];
        game.undo();
        board.position(game.fen());
        
        if (moveIndex > 0) {
            const prevMove = moves[moveIndex - 1];
            highlightSquares(prevMove.from, prevMove.to);
        } else {
            // 첫 위치로 돌아갔을 때는 하이라이트 제거
            if (lastMove) {
                $(`#board .square-${lastMove.from}`).css('background-color', '');
                $(`#board .square-${lastMove.to}`).css('background-color', '');
                lastMove = null;
            }
        }
        updateDisplay();
    }
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

// 주석 입력창 엔터키 처리
document.getElementById('comment-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveComment();
    }
});

// window.onload 함수를 하나로 통합
// 페이지 기본 경로를 동적으로 설정
const basePath = window.location.hostname === 'ohndal.github.io' ? '/chess-pgn-viewer' : '';

window.onload = function() {
    console.log('Initializing Chessboard...');
    board = Chessboard('board', {
        position: 'start',
        draggable: false,
        pieceTheme: `${basePath}/img/chesspieces/wikipedia/{piece}.png`
    });

    console.log('Chessboard initialized', board);

    // 모든 이벤트 리스너 등록
    document.getElementById('next').addEventListener('click', nextMove);
    document.getElementById('prev').addEventListener('click', prevMove);
    document.getElementById('pgn').addEventListener('input', loadPGN);
    document.getElementById('save-comment-btn').addEventListener('click', saveComment);
    document.getElementById('excellent-btn').addEventListener('click', markExcellent);
    document.getElementById('blunder-btn').addEventListener('click', markBlunder);
    document.getElementById('save-game').addEventListener('click', saveGame);
    document.getElementById('generate-embed').addEventListener('click', generateEmbedCode);
    
    moves = [];
    moveIndex = 0;
    comments = {};
    updateDisplay();
}

// generateEmbedCode 함수 수정
function generateEmbedCode() {
    try {
        const gameData = {
            pgn: document.getElementById('pgn').value,
            comments: comments,
            moves: moves.map(move => ({
                ...move,
                san: move.san
            }))
        };
        
        const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(gameData));
        const viewerUrl = `https://ohndal.github.io/chess-pgn-viewer/viewer.html?data=${compressed}`;
        
        const embedCode = `<iframe src="${viewerUrl}" width="1000" height="650" frameborder="0"></iframe>`;
        
        // 클립보드 복사 시도
        navigator.clipboard.writeText(embedCode)
            .then(() => {
                alert('임베드 코드가 클립보드에 복사되었습니다!');
            })
            .catch(err => {
                console.error('클립보드 복사 실패:', err);
                // 복사 실패 시 사용자에게 코드 표시
                alert('클립보드 복사에 실패했습니다. 수동으로 복사해주세요:\n\n' + embedCode);
            });
    } catch (error) {
        console.error('임베드 코드 생성 중 오류:', error);
        alert('임베드 코드 생성 중 오류가 발생했습니다.');
    }
}