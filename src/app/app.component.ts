import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'my-app';
  private center: Array<number> = [-117.18926546776538, 34.06076484034564];
  private zoomLevel = 13;
}
