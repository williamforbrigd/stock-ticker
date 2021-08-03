import React, { useEffect, useState } from "react";
import protobuf from "protobufjs";
import "./App.css";

function App() {
  const [stonks, setStonks] = useState<any[]>([]);

  const format = (price: number): string => {
    return `${price.toFixed(2)} NOK`;
  };

  const emoji: any = { up: "🚀", down: "🥺" };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    protobuf.load("/YPricingData.proto", function (err, root) {
      if (err) throw err;

      const Yaticker = root?.lookupType("yaticker");
      const ws = new WebSocket("wss://streamer.finance.yahoo.com");

      ws.onopen = function open() {
        console.log("connected");
        ws.send(
          JSON.stringify({
            subscribe: (params.get("symbols") || "GME")
              .split(",")
              .map((stonk) => stonk.toUpperCase()),
          })
        );
      };

      ws.onclose = function close() {
        console.log("disconnected");
      };

      ws.onmessage = function incoming(message: any) {
        const x = Yaticker?.decode(new Buffer(message.data, "base64"));
        const next = JSON.parse(JSON.stringify(x));

        setStonks((current) => {
          let stonk = current.find((stonk) => stonk.id === next.id);
          if (stonk) {
            return current.map((stonk) => {
              if (stonk.id === next.id) {
                return {
                  ...next,
                  direction:
                    stonk.price < next.price
                      ? "up"
                      : stonk.price > next.price
                      ? "down"
                      : stonk.direction,
                };
              }
              return stonk;
            });
          } else {
            return [
              ...current,
              {
                ...next,
                direction: "",
              },
            ];
          }
        });
      };
    });
  }, []);

  return (
    <div className="stonks">
      {stonks.map((stonk: any) => (
        <div className="stonk" key={stonk.id}>
          <h2 className={stonk.direction}>
            {stonk.id} {format(stonk.price)} {emoji[stonk.direction]}{" "}
          </h2>
        </div>
      ))}
    </div>
  );
}

export default App;
