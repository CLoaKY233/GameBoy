import psutil
import GPUtil
import time
import curses

def get_cpu_stats():
    cpu_usage = psutil.cpu_percent(interval=1)
    cpu_times = psutil.cpu_times()
    cpu_count_logical = psutil.cpu_count(logical=True)
    cpu_count_physical = psutil.cpu_count(logical=False)
    return {
        "usage": cpu_usage,
        "times": cpu_times,
        "logical_count": cpu_count_logical,
        "physical_count": cpu_count_physical
    }

def get_gpu_stats():
    gpus = GPUtil.getGPUs()
    gpu_stats = []
    for gpu in gpus:
        gpu_stats.append({
            "id": gpu.id,
            "name": gpu.name,
            "load": gpu.load * 100,
            "memory_free": gpu.memoryFree,
            "memory_used": gpu.memoryUsed,
            "memory_total": gpu.memoryTotal,
            "temperature": gpu.temperature
        })
    return gpu_stats

def main(stdscr):
    curses.curs_set(0)  # Hide the cursor
    stdscr.nodelay(1)   # Don't block I/O calls

    while True:
        stdscr.clear()

        # Fetch CPU stats
        cpu_stats = get_cpu_stats()
        stdscr.addstr(0, 0, "CPU Stats:")
        stdscr.addstr(1, 0, f"Usage: {cpu_stats['usage']}%")
        stdscr.addstr(2, 0, f"Logical CPUs: {cpu_stats['logical_count']}")
        stdscr.addstr(3, 0, f"Physical CPUs: {cpu_stats['physical_count']}")
        stdscr.addstr(4, 0, f"Times: {cpu_stats['times']}")

        # Fetch GPU stats
        gpu_stats = get_gpu_stats()
        stdscr.addstr(6, 0, "GPU Stats:")
        for idx, gpu in enumerate(gpu_stats):
            stdscr.addstr(7 + idx * 6, 0, f"GPU ID: {gpu['id']}")
            stdscr.addstr(8 + idx * 6, 0, f"Name: {gpu['name']}")
            stdscr.addstr(9 + idx * 6, 0, f"Load: {gpu['load']}%")
            stdscr.addstr(10 + idx * 6, 0, f"Free Memory: {gpu['memory_free']}MB")
            stdscr.addstr(11 + idx * 6, 0, f"Used Memory: {gpu['memory_used']}MB")
            stdscr.addstr(12 + idx * 6, 0, f"Total Memory: {gpu['memory_total']}MB")
            stdscr.addstr(13 + idx * 6, 0, f"Temperature: {gpu['temperature']} °C")

        stdscr.refresh()
        time.sleep(0.25)

if __name__ == "__main__":
    curses.wrapper(main)
