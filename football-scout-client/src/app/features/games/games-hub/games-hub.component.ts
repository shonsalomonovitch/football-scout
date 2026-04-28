import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-games-hub',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './games-hub.component.html',
  styleUrl: './games-hub.component.css',
})
export class GamesHubComponent {}
