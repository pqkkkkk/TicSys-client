import React from "react";
import styles from "./PaymentInfo.module.css";
import vnPayLogo from "../../../../assets/image/vnpay.jpg";
import zaloPayLogo from "../../../../assets/image/zalopaylogo.png";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { GetEventByIdApi } from "../../../../services/api/EventApi";
import { GetOrderByIdWithDetailOrderAndTicketAndPromotionApi,
    PayOrderApi } from "../../../../services/api/OrderApi";
import { GetUnusedVoucherOfUsers } from "../../../../services/api/PromotionApi";
import { GetUser } from "../../../../services/UserStorageService";
import { GetPaymentMethodsOfUserApi } from "../../../../services/api/AccountApi";

function PaymentInfo() {
    const navigate = useNavigate();
    const {eventId, orderId} = useParams();
    
    const [currentUser, setCurrentUser] = useState(GetUser());
    const [event, setEvent] = useState({});
    const [order, setOrder] = useState({});
    const [ticketOfOrders, setTicketOfOrders] = useState([]);
    const [ticketInfos, setTicketInfos] = useState([]);
    const [totalTickets, setTotalTickets] = useState(0);
    const [promotionInfo, setPromotionInfo] = useState({});
    const [vouchers, setVouchers] = useState([]);
    const [seletedVoucherId, setSelectedVoucherId] = useState(null);
    const [bankAcountList, setBankAccountList] = useState([]);
    const [selectedBankAccountId, setSelectedBankAccountId] = useState(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

    useEffect(() => {
        const fetchEvent = async () => {

            if(currentUser === null) {
                navigate("/signin");
            }
            const [eventData, orderData, vouchersData] = await Promise.all([GetEventByIdApi(eventId),
                                                            GetOrderByIdWithDetailOrderAndTicketAndPromotionApi(orderId),
                                                            GetUnusedVoucherOfUsers(currentUser.userName)]);
            if(orderData.order.status === "PAID")
            {
                navigate("/error");
            }
            setOrder(orderData.order);
            setTicketOfOrders(orderData.ticketOfOrders);
            setTicketInfos(orderData.ticketInfos);
            setPromotionInfo(orderData.promotionInfo);
            setVouchers(vouchersData);
            setEvent(eventData);
        }
        fetchEvent();
    }, [eventId,currentUser, orderId, navigate]);
    useEffect(() => {
        setTotalTickets(ticketOfOrders.reduce((total, ticketOfOrder) => total + ticketOfOrder.quantity, 0));
    }, [ticketOfOrders]);
    useEffect(() => {
        const fetchBankAccount = async () => {
            const response = await GetPaymentMethodsOfUserApi(currentUser.userName, selectedPaymentMethod);
            if(response && response.length > 0) {
                setBankAccountList(response);
            }
            else {
                alert("You have no bank account. Please link to your bank account first.");
                setBankAccountList([]);
            }
        }
        if(selectedPaymentMethod)
            fetchBankAccount();
    },[selectedPaymentMethod]);

    const HandlePayment = async () => {
        const response = await PayOrderApi(orderId, selectedBankAccountId, seletedVoucherId);

        if(response)
        {
            if(response === "processing"){
                alert("Payment success");
                navigate("/");
            }
        }
        else{
            alert("Payment failed");
        }
    }
    return(
        <div className={styles["container"]}>
             <div className={styles["step-container"]}>
                <div className={styles["step"]}>
                    <div className={styles["circle"] + " " + styles["completed"]}>
                        <i class="fas fa-check"></i>
                    </div>
                    <div className={styles["text"] + " " + styles["completed"]}>Select Ticket</div>
                </div>
                <div className={styles["divider"]}></div>
                <div className={styles["step"]}>
                    <div className={styles["circle"] + " " + styles["completed"]}>
                        <i class="fas fa-check"></i>
                    </div>
                    <div className={styles["text"] + " " + styles["completed"]}>Question Form</div>
                </div>
                <div className={styles["divider"]}></div>
                <div className={styles["step"]}>
                    <div className={styles["circle"] + " " + styles["active"]}>
                        <div className={styles["inner-circle"]}></div>
                    </div>
                    <div className={styles["text"] + " " + styles["active"]}>Payment Info</div>
                </div>
            </div>

            <div className={styles["event-info-and-timer"]}>
                <div className={styles["event-info"]}>
                    <h1>{event?.event?.name}</h1>
                    <div className={styles["details"]}>
                        <div><i class="fas fa-map-marker-alt"></i>{event?.event?.location} </div>
                        <div><i class="fas fa-calendar-alt"></i>{event?.event?.time} - {event?.event?.date}</div>
                    </div>
                </div>
                <div className={styles["timer"]}>
                    <div className={styles["box"]}>
                        <div className={styles["text"]}>Complete your booking within</div>
                        <div className={styles["time"]}>14 : 35</div>
                    </div>
                </div>
            </div>
            <div className={styles["main-content"]}>
                <div className={styles["p ayment-info"]}>
                    <h2>PAYMENT INFO</h2>
                    <div className={styles["alert"]}>
                        <i class="fas fa-info-circle"></i>
                        <span>Please check ticket receiving info. If there are any changes, <a href="#">please update here</a></span>
                    </div>
                    <div className={styles["info-box"]}>
                        <div>
                            <div className={styles["font-semibold"]}>Ticket receiving info</div>
                            <div>{currentUser ? currentUser.fullName : "No name"}</div>
                            <div>{currentUser ? currentUser.phoneNumber : "No phone number"}</div>
                            <div>{currentUser ? currentUser.email : "No email"}</div>
                        </div>
                        <a href="#">Edit</a>
                    </div>
                    <div className={styles["payment-method"]}>
                        <div className={styles["font-semibold"]}>Payment method</div>
                        <div className={styles["method"]}>
                            <input
                                disabled
                                type="radio" id="vnpay" name="payment"/>
                            <label htmlFor="vnpay">
                                <img src={vnPayLogo} alt="VNPAY logo" width="24" height="24"/>
                                VNPAY
                            </label>
                        </div>
                        <div className={styles["method"]}>
                            <input
                                checked={selectedPaymentMethod === "tsbank"}
                                onChange={(e) => {
                                    setSelectedPaymentMethod(e.target.id);
                                }}       
                                type="radio" id="tsbank" name="payment"/>
                            <label htmlFor="tsbank">
                                <img src={zaloPayLogo} alt="Zalopay logo" width="24" height="24"/>
                                    TicSys Banking
                                <span>New</span>
                            </label>
                        </div>
                        <div className={styles["bank-account"]}>
                            <select
                                value={selectedBankAccountId}
                                onChange={(e) => setSelectedBankAccountId(e.target.value)}
                                name="bank-account">
                                <option value="" disabled selected>SELECT YOUR BANK ACCOUNT</option>
                                {bankAcountList.map((account) => (
                                    <option value={account.bankAccountNumber}>{account.bankAccountNumber} -  {account.bankName}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className={styles["order-summary"]}>
                    <div className={styles["ticket-infos"]}>
                        <div className={styles["header"]}>
                            <div className={styles["font-semibold"]}>Ticket information</div>
                            <a href="#">Reselect Ticket</a>
                        </div>
                        <div className={styles["details"]}>
                            <div className={styles["title"]}>
                                <span>Ticket type</span>
                                <span>Quantity</span>
                            </div>
                            {ticketOfOrders.map((ticketOfOrder, index) => (
                                <div className={styles["ticket-info-container"]}>
                                    <div className={styles["ticket-info"]}>
                                        <span>{ticketInfos.at(index).name}</span>
                                        <span>{ticketOfOrder.quantity}</span>
                                    </div>
                                    <div className={styles["ticket-info"]}>
                                        <span>{ticketInfos.at(index).price?.toLocaleString('vi-VN')} đ</span>
                                        <span>{(ticketInfos.at(index).price * ticketOfOrder.quantity).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className={styles["ticket-info-divider"]}></div>
                                </div>
                                ))}
                        </div>
                    </div>
                    <div className={styles["order-info"]}>
                        <div className={styles["header"]}>
                            <div className={styles["font-semibold"]}>Discount</div>
                        </div>
                        <div className={styles["discount"]}>
                            <input type="text" placeholder="ENTER DISCOUNT CODE"/>
                            <button>Apply</button>
                        </div>
                        <div className={styles["vouchers"]}>
                            <select
                                value={seletedVoucherId}
                                onChange={(e) => setSelectedVoucherId(e.target.value)}
                                name="vouchers" className={styles["voucher-select"]}>
                                <option value="" disabled selected>SELECT AVAILABLE VOUCHER OF YOURS</option>
                                {vouchers.map((voucher) => (
                                    <option value={voucher.id}>{voucher.voucherValue?.toLocaleString('vi-VN')} đ</option>
                                ))}
                            </select>
                            <button>Apply</button>
                        </div>
                        <div className={styles["details"]}>
                            <div>
                                <span>Actual price</span>
                                <span>{promotionInfo ? (order.price + promotionInfo.reduction).toLocaleString('vi-VN') : order.price.toLocaleString('vi-VN')} đ</span>
                            </div>
                            {promotionInfo?.type === "Flash Sale" && <div>
                                <span>Promotion</span>
                                <span>- {promotionInfo.reduction.toLocaleString('vi-VN')} đ</span>
                            </div>
                            }
                             {promotionInfo?.type === "Voucher Gift" && <div>
                                <span>Promotion</span>
                                <span>Voucher {promotionInfo.voucherValue.toLocaleString('vi-VN')} đ</span>
                            </div>
                            }
                            <div>
                                <span>Total</span>
                                <span className={styles["total"]}>{order?.price?.toLocaleString('vi-VN')} đ</span>
                            </div>
                        </div>
                        <div className={styles["terms"]}>
                            By proceeding the order, you agree to the <a href="#">General Trading Conditions</a>
                        </div>
                        <button onClick={HandlePayment} className={styles["payment-btn"]}>Payment</button>
                    </div>
                </div>
            </div>
    </div>
)};

export default PaymentInfo;