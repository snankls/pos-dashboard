import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  templateUrl: './breadcrumb.component.html',
})
export class BreadcrumbComponent implements OnInit {
  pageTitle: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    let activeRoute = this.route;
    while (activeRoute.firstChild) {
      activeRoute = activeRoute.firstChild;
    }

    activeRoute.data.subscribe(data => {
      if (data['title']) {
        this.pageTitle = data['title'];
      }
    });
  }
}
