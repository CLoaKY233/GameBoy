#[derive(Debug)]
pub enum PowerError {
    NotAdmin,
    InvalidProcessorState,
    InvalidPowerType,
    InvalidBoostMode,
    CommandFailed(String),
    Other(String),
}

impl std::fmt::Display for PowerError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            PowerError::NotAdmin => write!(f, "This function requires administrator privileges!"),
            PowerError::InvalidProcessorState => {
                write!(f, "Processor state cannot be set below 20%")
            }
            PowerError::InvalidPowerType => write!(f, "Power type must be 'ac', 'dc', or 'both'"),
            PowerError::InvalidBoostMode => write!(f, "Invalid boost mode"),
            PowerError::CommandFailed(e) => write!(f, "Command failed: {}", e),
            PowerError::Other(e) => write!(f, "Error: {}", e),
        }
    }
}
