import { Component, OnInit } from "@angular/core";
import { MatTableDataSource } from "@angular/material";
import { ActivatedRoute } from "@angular/router";
import { OpenidService } from "../service/openid.service";
import { validateHorizontalPosition } from "@angular/cdk/overlay";

export interface PeriodicElement {
  request_start_date: string;
  request_report_date: string;
  req_status: string;
}

@Component({
  selector: "app-requester",
  templateUrl: "./requester.component.html",
  styleUrls: ["./requester.component.css"]
})

export class RequesterComponent implements OnInit {
  
  idToken;
  userName: String;
  ELEMENT_DATA: PeriodicElement[];
  

  constructor(
    private openId: OpenidService,
    private activatedRoute: ActivatedRoute
  ) {
    
  }

  ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe(queryParam => {
      // this.authenticationCode = queryParam.get("code");
      console.log("********** insidopenIde auth", queryParam.get("code"));
      this.openId
        .postAuthenticationCodForAccessAndIdToken(queryParam.get("code"))
        .subscribe(response => {
          console.log("token", response);
          this.idToken = response.id_token;
          //this.val()
          this.openId.postValidateTokeId(this.idToken).subscribe(res => {
            console.log(res);
            localStorage.setItem("userEmail", res.decoded_token.email);
            localStorage.setItem("l_name", res.decoded_token.family_name);
            localStorage.setItem("f_name", res.decoded_token.given_name);

            this.openId
              .checkEmployeePresence(res.decoded_token.email)
              .subscribe(response => {
                localStorage.setItem("employee_id", response.response[0].employee_id)
                if (response.response.length == 0) {
                  let requestData = {
                    employee_email: localStorage.getItem("userEmail"),
                    employee_firstname: localStorage.getItem("f_name"),
                    employee_lastname: localStorage.getItem("l_name"),
                    
                  };
                  console.log("This user is not found..entring data");

                  this.openId.addEmployee(requestData).subscribe(response_ => {
                    console.log(response_);
                    this.userName = localStorage.getItem("f_name") + " " + localStorage.getItem("l_name")
                  });

                } else {
                  console.log("user found", response);
                  this.userName = localStorage.getItem("f_name") + " " + localStorage.getItem("l_name")
                  this.openId.getAllRequestForEmployee(response.response[0].employee_id).subscribe(
                     data => {this.dataSource = new MatTableDataSource(data)
                    // data => {
                    // this.ELEMENT_DATA = data
                    console.log("emploeyee_data",data);                   
                  })
                }
              });
          });
        });
    });
  }

  displayedColumns: string[] = ["request_start_date", "request_report_date", "req_status"];
  dataSource = new MatTableDataSource(this.ELEMENT_DATA);

  btnColor(requestStatus: string) {
    if (requestStatus === "Declined") {
      return "btn-danger";
    } else if (requestStatus === "Approved") {
      return "btn-success";
    } else {
      return "btn-lemon";
    }
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
