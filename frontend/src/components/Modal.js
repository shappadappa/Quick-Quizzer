const Modal = ({closeFunction, modalMsg, confirmFunction, buttonMsg}) => {
    return (
        <div className="modal-container">
            <div className="modal">
                <div className="close" onClick={() => closeFunction(false)}>x</div>
                <span>{modalMsg}</span>
                <button onClick={() => confirmFunction()}>{buttonMsg}</button>
            </div>
        </div>
    );
}
 
export default Modal;