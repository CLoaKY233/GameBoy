import subprocess
import ctypes
import sys

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def set_processor_power_settings(boost_mode="1", max_processor_state="95", power_type="both"):
    try:
        boost_mode = int(boost_mode)
        max_processor_state = int(max_processor_state)
        messages = []

        # Check for admin privileges first
        if not is_admin():
            return "Error: This function requires administrator privileges!\nPlease run the application as administrator."

        # Add check for processor state
        if max_processor_state < 20:
            return "Error: Processor state cannot be set below 20%\nThis could cause system instability"

        # Validate power_type
        if power_type.lower() not in ["ac", "dc", "both"]:
            return "Error: power_type must be 'ac', 'dc', or 'both'"

        # Dictionary of valid boost modes
        BOOST_MODES = {
            0: "Disabled",
            1: "Enabled",
            2: "Aggressive",
            3: "Efficient Enabled",
            4: "Efficient Aggressive",
            5: "Aggressive At Guaranteed",
            6: "Efficient Aggressive At Guaranteed"
        }

        # Validate boost mode
        if boost_mode not in BOOST_MODES:
            return f"Error: Invalid boost mode. Valid values are: {', '.join([f'{k}: {v}' for k, v in BOOST_MODES.items()])}"

        try:
            # Get the active power scheme GUID
            cmd_get_active = "powercfg /getactivescheme"
            result = subprocess.check_output(cmd_get_active, shell=True).decode()
            scheme_guid = result.split()[3]

            # Set processor boost mode
            messages.append(f"Setting processor boost mode to: {BOOST_MODES[boost_mode]}")

            # GUID for processor boost mode
            boost_guid = "be337238-0d82-4146-a960-4f3749d470c7"

            if power_type.lower() in ["ac", "both"]:
                # Set AC power boost mode
                subprocess.run([
                    "powercfg", "/setacvalueindex",
                    scheme_guid, "54533251-82be-4824-96c1-47b60b740d00",
                    boost_guid, str(boost_mode)
                ], check=True)
                messages.append("AC power boost mode updated successfully")

            if power_type.lower() in ["dc", "both"]:
                # Set DC power boost mode
                subprocess.run([
                    "powercfg", "/setdcvalueindex",
                    scheme_guid, "54533251-82be-4824-96c1-47b60b740d00",
                    boost_guid, str(boost_mode)
                ], check=True)
                messages.append("DC power boost mode updated successfully")

            # Set maximum processor state
            if not (0 <= max_processor_state <= 100):
                return "Error: Maximum processor state must be between 0 and 100"

            messages.append(f"Setting maximum processor state to: {max_processor_state}%")

            # GUID for maximum processor state
            max_proc_guid = "bc5038f7-23e0-4960-96da-33abaf5935ec"

            if power_type.lower() in ["ac", "both"]:
                # Set AC power maximum processor state
                subprocess.run([
                    "powercfg", "/setacvalueindex",
                    scheme_guid, "54533251-82be-4824-96c1-47b60b740d00",
                    max_proc_guid, str(max_processor_state)
                ], check=True)
                messages.append("AC power maximum processor state updated successfully")

            if power_type.lower() in ["dc", "both"]:
                # Set DC power maximum processor state
                subprocess.run([
                    "powercfg", "/setdcvalueindex",
                    scheme_guid, "54533251-82be-4824-96c1-47b60b740d00",
                    max_proc_guid, str(max_processor_state)
                ], check=True)
                messages.append("DC power maximum processor state updated successfully")

            # Apply the changes
            subprocess.run(["powercfg", "/setactive", scheme_guid], check=True)
            messages.append("All power settings applied successfully!")

            return "\n".join(messages)

        except subprocess.CalledProcessError as e:
            return f"Error: Failed to execute power settings command\n{str(e)}"
        except Exception as e:
            return f"Error: An unexpected error occurred while setting power settings\n{str(e)}"

    except ValueError as e:
        return f"Error: Invalid input values\n{str(e)}"
    except Exception as e:
        return f"Error: An unexpected error occurred\n{str(e)}"

# Optional: Function to list available boost modes (for debugging)
def list_boost_modes():
    boost_modes = {
        0: "Disabled",
        1: "Enabled",
        2: "Aggressive",
        3: "Efficient Enabled",
        4: "Efficient Aggressive",
        5: "Aggressive At Guaranteed",
        6: "Efficient Aggressive At Guaranteed"
    }
    return "\n".join([f"{mode}: {description}" for mode, description in boost_modes.items()])
