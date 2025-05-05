

module.exports = (io) => {
    const players = [];
    const rooms = {};
    const ans = {};
    const firstCorrectExpression = {}

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("createRoom", ({ name, roomCode }, callback) => {
            socket.join(roomCode);
            rooms[roomCode] = [{ id: socket.id, name }];
            socket.data.name = name;
            socket.data.roomCode = roomCode;

            console.log(`Room created: ${roomCode} by ${name}`);
            callback(roomCode);
            io.to(roomCode).emit("playerJoined", rooms[roomCode]);
        });

        socket.on("joinRoom", ({ code, name }, callback) => {
            console.log(rooms);
            const room = rooms[code];
            if (room) {
                socket.join(code);
                socket.data.name = name;
                socket.data.roomCode = code;
                room.push({ id: socket.id, name });

                console.log(`${name} joined room ${code}`);
                callback({ success: true });
                io.to(code).emit("playerJoined", room);
            } else {
                callback({ success: false, message: "Room not found" });
            }
        });

        socket.on("startGame", ({ code }, callback) => {
            console.log(code)
            io.to(code).emit("gameStart", { code });

            if (callback) callback({ success: true });
        });

        socket.on("getAnswer", ({ code }, callback) => {
            console.log("Luv")
            const operatorsPool = ["+", "-", "", "/"];
            let numbers, operators, answer;
            let expression;

            while (true) {
                numbers = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9) + 1);
                operators = Array.from({ length: 3 }, () => {
                    return operatorsPool[Math.floor(Math.random() * operatorsPool.length)];
                });

                expression = `${numbers[0]} ${operators[0]} ${numbers[1]} ${operators[1]} ${numbers[2]} ${operators[2]} ${numbers[3]}`;

                try {
                    const result = eval(expression);
                    if (
                        isFinite(result) &&
                        !isNaN(result) &&
                        result >= 10 &&
                        result <= 100 &&
                        Number.isInteger(result)
                    ) {
                        answer = result;
                        break;
                    }
                } catch (err) {
                    console.error("Eval error:", err);
                }
            }

            console.log("ส่งโจทย์:", { numbers, operators, expression, answer });

            if (rooms[code]) {
                io.to(code).emit("sendAnswer", { numbers, operators, expression, answer });
                console.log(`Sent answer to room: ${code}`);
            } else {
                console.error(`Room with code ${code} does not exist`);
            }

            if (callback) callback({ success: true, data: { numbers, operators, expression, answer } });
        });

        socket.on("checkAnswer", ({ userExpression, originalExpression, answer, timeTaken, roomId }, callback) => {

            try {
                const userAnswer = eval(userExpression);
                const expectedAnswer = Number(answer);
                const isCorrect = Number(userAnswer) === expectedAnswer;

                const time = Math.min(Math.max(Number(timeTaken), 0), 20); 

                firstCorrectExpression[roomId] = "";

                const baseResponse = {
                    correct: isCorrect,
                    originalExpression,
                    answer: expectedAnswer,
                    firstCorrectExpression: firstCorrectExpression[roomId],
                };

                const isTimeout = time >= 20;

                if (isCorrect) {
                    const score = isTimeout ? 0 : Math.round((1 - time / 20) * 100);

                    if (!firstCorrectExpression[roomId]) {
                        firstCorrectExpression[roomId] = userExpression;
                        console.log("บันทึกวิธีคิดแรก:", userExpression);
                    }

                    if (callback) callback({
                        ...baseResponse,
                        message: isTimeout ? "หมดเวลา" : "คำตอบถูกต้อง",
                        score,
                    });
                } else {
                    if (callback) callback({
                        ...baseResponse,
                        message: isTimeout ? "หมดเวลา" : "คำตอบผิด",
                        score: 0,
                    })
                }
            } catch (err) {
                if (callback) callback({
                    correct: false,
                    message: "เกิดข้อผิดพลาดในการตรวจคำตอบ",
                    score: 0,
                    originalExpression,
                    answer: Number(answer),
                    firstCorrectExpression: firstCorrectExpression[roomId],
                });
            }
        })

        socket.on("setCorrect", ({ playerId }, callback) => {
            io.to(playerId).emit("setCorrect", { playerId });
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            const { roomCode, name } = socket.data;
            if (roomCode && rooms[roomCode]) {
                rooms[roomCode] = rooms[roomCode].filter(p => p.id !== socket.id);
                io.to(roomCode).emit("playerJoined", rooms[roomCode]);

                if (rooms[roomCode].length === 0) {
                    delete rooms[roomCode];
                    console.log(`Room ${roomCode} deleted`);
                }
            }
        });
    });
};
