import { CompactNinjaArtwork } from "./PixelNinja";

const ink = "#160e27", deep = "#291741", purple = "#4e2a84", mid = "#705093", lilac = "#a18aba", light = "#d8c4ff";

/** Positioned at the telescope's eyepiece, on a tiny observation platform. */
export function TelescopeOperator() {
  return <g data-campus-activity="astronomy">
    <path fill={ink} d="M-160 122h68v6h-68z" />
    <path fill={mid} d="M-152 76h56v6h-56zM-148 82h4v40h-4zM-104 82h4v40h-4zM-144 94h40v4h-40zM-144 108h40v4h-40z" />
    <path fill={lilac} d="M-152 76h56v2h-56z" />
    <g transform="translate(-142 36) scale(2)" className="member-working crew-astronomer" data-crew-role="astronomer">
      <CompactNinjaArtwork />
    </g>
    <path fill={mid} d="M-116 60h12v6h-12zM-110 66h4v8h-4z" />
    <path className="crew-focus-light" fill={light} d="M-114 60h4v2h-4z" />
  </g>;
}

export default function StadiumConstructionCrew() {
  return <g className="stadium-construction-crew" data-campus-activity="construction">
    {/* Tower crane: the cable and load travel together while the operator stays in the cab. */}
    <g transform="translate(0 16)" data-crew-equipment="crane">
      <path fill={ink} d="M496 936h64v8h-64z" />
      <path fill={mid} d="M512 760h6v176h-6zM532 760h6v176h-6zM512 780h26v4h-26zM512 812h26v4h-26zM512 844h26v4h-26zM512 876h26v4h-26zM512 908h26v4h-26z" />
      <path fill={lilac} opacity=".6" d="M518 784h4v8h4v8h6v8h-4v-8h-4v-8h-6zM518 848h4v8h4v8h6v8h-4v-8h-4v-8h-6zM518 912h4v8h4v8h6v8h-4v-8h-4v-8h-6z" />
      <path fill={mid} d="M480 750h184v10H480zM484 760h28v16h-28zM522 738h6v12h-6z" />
      <path fill={lilac} d="M480 750h184v2H480zM490 754h8v4h-8zM514 754h8v4h-8zM538 754h8v4h-8zM562 754h8v4h-8zM586 754h8v4h-8zM610 754h8v4h-8zM634 754h8v4h-8z" />
      <path fill={purple} d="M506 808h48v42h-48z" />
      <path fill={ink} d="M510 812h40v34h-40z" />
      <g transform="translate(516 814) scale(1.5)" className="member-working" data-crew-role="crane-operator"><CompactNinjaArtwork /></g>
      <path fill={lilac} d="M506 806h48v4h-48zM506 846h48v4h-48z" />
      <path fill={mid} d="M530 840h16v4h-16zM540 836h2v4h-2zM564 760h20v8h-20z" />
      <g transform="translate(573 768)"><path className="crew-crane-cable" fill={lilac} d="M0 0h2v88H0z" /></g>
      <g transform="translate(568 856)"><g className="crew-crane-load">
        <path fill={lilac} d="M5 0h2v6H1v2h8V0zM-8 10h28v2H-8z" />
        <path fill={purple} d="M-6 12h24v18H-6z" />
        <path fill={mid} d="M-6 12h24v4H-6zM-6 22h24v2H-6zM4 16h2v6H4zM10 24h2v6h-2z" />
      </g></g>
    </g>

    {/* Bricklayer, a moving hammer, and a small wall in the forecourt. */}
    <g data-crew-equipment="brickwork">
      <path fill={ink} d="M670 960h120v6H670z" />
      <g transform="translate(676 922) scale(2)" className="crew-builder" data-crew-role="bricklayer"><CompactNinjaArtwork /></g>
      <g transform="translate(708 942)"><g className="crew-hammer">
        <path fill={mid} d="M-2-14h4V2h-4z" /><path fill={lilac} d="M-8-18H8v6H-8z" />
      </g></g>
      <path fill={purple} d="M724 940h56v22h-56z" />
      <path fill={mid} d="M724 940h56v3h-56zM724 948h56v2h-56zM724 956h56v2h-56zM740 943h2v5h-2zM760 943h2v5h-2zM730 950h2v6h-2zM750 950h2v6h-2zM770 950h2v6h-2z" />
      <path fill={lilac} opacity=".7" d="M728 940h10v2h-10zM748 940h10v2h-10z" />
      <g transform="translate(718 940)"><path className="crew-building-dust" fill={lilac} d="M0 0h2v2H0zM8-4h2v2H8zM18 2h2v2h-2z" /></g>
    </g>

    {/* Excavator driver and a gently digging boom; the tracked base stays planted. */}
    <g transform="translate(832 936)" data-crew-equipment="excavator">
      <path fill={ink} d="M-4 28h112v6H-4zM0 16h100v12H0z" />
      <path fill={mid} d="M4 18h92v8H4zM0 4h92v12H0z" />
      <path fill={purple} d="M10 2h68v6H10zM16-28h46V4H16z" />
      <path fill={deep} d="M20-24h38V4H20z" />
      <g transform="translate(22 -25) scale(1.5)" className="member-working" data-crew-role="excavator-driver"><CompactNinjaArtwork /></g>
      <path fill={lilac} d="M16-30h48v4H16zM16 2h48v4H16zM8 20h8v2H8zM24 20h8v2h-8zM40 20h8v2h-8zM56 20h8v2h-8zM72 20h8v2h-8zM88 20h4v2h-4z" />
      <g transform="translate(84 6)"><g className="crew-excavator-arm">
        <path fill={mid} d="M-4 0v-30h8v-8h30v8h8v30h-6v-26H8v4H4V0zM34-2h22v12H34v-4h-4v-8z" />
        <path fill={lilac} d="M4-38h30v2H4zM-2-8h4v4h-4zM36 8h20v2H36z" />
        <path fill={purple} d="M38 0h14v6H38z" />
      </g></g>
    </g>

    {/* Lavender safety cones keep the scene within the Northwestern palette. */}
    <g fill={mid}><path d="M636 958h18v4h-18zM638 954h14v4h-14zM642 944h6v10h-6zM804 962h18v4h-18zM806 958h14v4h-14zM810 948h6v10h-6z" /></g>
    <path fill={light} d="M640 952h10v2h-10zM808 956h10v2h-10z" />
  </g>;
}
