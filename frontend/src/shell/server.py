import asyncio
import websockets
import subprocess

async def shell(websocket, path):
    process = subprocess.Popen(
        ["/bin/bash"],  # Use Bash as the shell
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1
    )

    async def read_output():
        while True:
            output = process.stdout.readline()
            if output:
                print(f"Sending to React: {output.strip()}")  # Debugging
                await websocket.send(output)
            await asyncio.sleep(0.1)

    asyncio.create_task(read_output())

    async for message in websocket:
        print(f"Received from React: {message}")  # Debugging
        if message:
            process.stdin.write(message + "\n")  
            process.stdin.flush()  

async def main():
    async with websockets.serve(shell, "localhost", 8765):
        await asyncio.Future()

asyncio.run(main())
