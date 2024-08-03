import React, { useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io('ws://localhost:3500');

function App() {
  const activityTimer = useRef(null);

  useEffect(() => {
    const msgInput = document.querySelector("#message");
    const nameInput = document.querySelector("#name");
    const chatRoom = document.querySelector("#room");
    const activity = document.querySelector(".activity");
    const usersList = document.querySelector(".user-list");
    const roomList = document.querySelector(".room-list");
    const chatDisplay = document.querySelector(".chat-display");

    function sendMessage(e) {
      e.preventDefault();
      if (nameInput.value && msgInput.value && chatRoom.value) {
        socket.emit("message", {
          name: nameInput.value,
          text: msgInput.value,
        });
        msgInput.value = "";
      }
      msgInput.focus();
    }

    function enterRoom(e) {
      e.preventDefault();
      if (nameInput.value && chatRoom.value) {
        socket.emit("enterRoom", {
          name: nameInput.value,
          room: chatRoom.value,
        });
      }
    }

    document.querySelector(".form-msg").addEventListener("submit", sendMessage);

    document.querySelector(".form-join").addEventListener("submit", enterRoom);

    msgInput.addEventListener("keypress", () => {
      socket.emit("activity", nameInput.value);
    });

    const handleOnMessage = (data) => {
      activity.textContent = "";
      const { name, text, time } = data;
      const li = document.createElement("li");
      li.className = "post";
      if (name === nameInput.value) li.className = "post post--left";
      if (name !== nameInput.value && name !== "Admin")
        li.className = "post post--right";
      if (name !== "Admin") {
        li.innerHTML = `<div class="post__header ${
          name === nameInput.value
            ? "post__header--user"
            : "post__header--reply"
        }">
                  <span class="post__header--name">${name}</span>
                  <span class="post__header--time">${time}</span>
              </div>
              <div class="post__text">${text}</div>`;
      } else {
        li.innerHTML = `<div class="post__text">${text}</div>`;
      }
      document.querySelector(".chat-display").appendChild(li);

      chatDisplay.scrollTop = chatDisplay.scrollHeight;
    };

    const handleOnActivity = (name) => {
      activity.textContent = `${name} is typing...`;

      // Clear after 3 seconds
      clearTimeout(activityTimer);
      activityTimer.current = setTimeout(() => {
        activity.textContent = "";
      }, 3000);
    };
    socket.on("message", handleOnMessage);

    socket.on("activity", handleOnActivity);

    const handleOnUserList = ({ users }) => {
      showUsers(users);
    };
    socket.on("userList", handleOnUserList);

    const handleOnRoomList = ({ rooms }) => {
      showRooms(rooms);
    };

    socket.on("roomList", handleOnRoomList);

    function showUsers(users) {
      usersList.textContent = "";
      if (users) {
        usersList.innerHTML = `<em>Users in ${chatRoom.value}:</em>`;
        users.forEach((user, i) => {
          usersList.textContent += ` ${user.name}`;
          if (users.length > 1 && i !== users.length - 1) {
            usersList.textContent += ",";
          }
        });
      }
    }

    function showRooms(rooms) {
      roomList.textContent = "";
      if (rooms) {
        roomList.innerHTML = `<em>Active Rooms:</em>`;
        rooms.forEach((room, i) => {
          roomList.textContent += ` ${room}`;
          if (rooms.length > 1 && i !== rooms.length - 1) {
            roomList.textContent += ",";
          }
        });
      }
    }

    return () => {
      // Remove event listeners
      document
        .querySelector(".form-msg")
        .removeEventListener("submit", sendMessage);
      document
        .querySelector(".form-join")
        .removeEventListener("submit", enterRoom);
      msgInput.removeEventListener("keypress", () => {
        socket.emit("activity", nameInput.value);
      });

      // Cleanup socket event listener
      socket.off("message", handleOnMessage);
      socket.off("activity", handleOnActivity);
      socket.off("userList", handleOnUserList);
      socket.off("roomList", handleOnRoomList);
    };
  }, []);

  return (
    <main>
      <form className="form-join">
        <input
          type="text"
          id="name"
          maxLength="8"
          placeholder="Your name"
          size="5"
          required
        />
        <input
          type="text"
          id="room"
          placeholder="Chat room"
          size="5"
          required
        />
        <button id="join" type="submit">
          Join
        </button>
      </form>

      <ul className="chat-display"></ul>

      <p className="user-list"></p>

      <p className="room-list"></p>

      <p className="activity"></p>

      <form className="form-msg">
        <input type="text" id="message" placeholder="Your Message" required />
        <button type="submit">Send</button>
      </form>
    </main>
  );
}

export default App;
