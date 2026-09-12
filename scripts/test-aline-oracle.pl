use strict;
use warnings;
use FindBin;
use Test::More;

# Execute only bounded serialization and copy routines from the trusted repository
# reference. Never evaluate a project file or initialize Perl/Tk.
my $root = "$FindBin::Bin/..";
open my $source_file, '<:raw', "$root/aline_011208/bin/aline" or die $!;
my $source = do { local $/; <$source_file> };
my ($routines) = $source =~ /^(sub savepackaline\(\$\$\$\)\n\{.*?)^sub UndumpDataFile/ms;
die 'Historical serialization routines not found' unless defined $routines;
our %prog = (name => 'ALINE oracle', version => 'R001', author => 'fixture', website => 'local');
eval $routines;
die $@ if $@;
for my $name (qw(_ObjPtrToId2 _CopySeq)) {
    my ($routine) = $source =~ /^(sub \Q$name\E\([^\n]*\)\n\{.*?)^sub /ms;
    die "Historical $name routine not found" unless defined $routine;
    eval $routine;
    die $@ if $@;
}

sub decode {
    my ($wire) = @_;
    my (%parameters, @rows, @palette);
    my $code = loadpackaline(\%parameters, \@rows, \@palette, $wire);
    return ($code, \%parameters, \@rows, \@palette);
}

my %parameters = (csh => 12, csv => 14, nch => 65, all => 1, custom => [2, 4]);
my @palette = (
    [0.5, ['red', 'red', 0, 'black', 12, 'Helvetica', 'R', 'Bold']],
    [0.9, ['red', 'red', 0, 'white', 12, 'Helvetica', 'R', 'Bold']],
    [100, [('', '', '', '', '', '', '', '')]],
);
my @cells = (
    {text => 'A'}, {text => '-', seqnumber => undef},
    {text => 'C', seqnumber => 1}, {text => 'D', seqnumber => 2},
    {text => 'E', seqnumber => 42}, {text => 'F', seqnumber => 0},
    {text => 'G', seqnumber => -3}, {text => 'H', seqnumber => 2.5},
    {text => 'label'}, {text => ''},
    map { +{text => 'A', fontfill => sprintf('#%06x', $_)} } 0..299,
);
my @rows = (
    {p => 7, n => 0, t => {text => 'Protein', comment => 'fixture', attach => -1,
        titlefill => '#112233', titlefoundry => 'Helvetica', titleslant => 'R',
        titlewidth => 'normal', titlesize => 15, titleweight => 'Bold', anchor => 'center'},
     custom => 'row-value', e => \@cells, o => [
        {multi => 1, z => 8, rev => undef, fwd => [1, 0], custom => 'object-value', e => [
            {type => 'Text', xpos => 1, otext => 'domain', lc => 'black'},
            {type => 'Text', xpos => 2, otext => '', lc => 'black'},
            {type => 'Text', xpos => 9, lc => 'black'},
        ]},
     ]},
    {p => 2, n => undef, t => {text => '%%%Graph', attach => 0},
     e => [{text => ' '}], o => [
        {multi => 1, z => 8, rev => [0, 0], fwd => undef, h => 3, cut => 0.5, e => [
            {type => 'LineGraph', xpos => 0, text => -1.25, lc => 'blue'},
            {type => 'LineGraph', xpos => 1, text => 0, lc => 'blue'},
            {type => 'LineGraph', xpos => 4, text => 2.5, lc => 'blue'},
        ]},
     ]},
);

# Cover every style field created for ordinary cells, independently of objects.
@{$cells[0]}{qw(fontfill fontfoundry fontslant fontwidth fontsize fontweight fontbg anchor xpos)} =
    ('#223344', 'Helvetica', 'I', 'condensed', 13, 'Medium', '#ddeeff', 'center', 0);

my $wire = savepackaline(\%parameters, \@rows, \@palette);
like($wire, qr/A\x05256\x05/, 'fixture exercises extended cell keys');
like($wire, qr/A\x80/, 'fixture exercises high-byte cell keys');
like($wire, qr/\x03=\x03/, 'palette uses equal-field compression');
like($wire, qr/\x03\x05\x03/, 'palette uses inherited-field compression');
my ($code, $parameters, $rows, $palette) = decode($wire);
is($code, 0, 'historical loader accepts historical writer output');
is_deeply($parameters, \%parameters, 'scalar and array preferences survive');
ok(!exists($rows->[0]{e}[9]{text}), 'historical split drops a trailing empty text value');
delete $rows[0]{e}[9]{text};
is_deeply($rows, \@rows, 'all other cells, numbering states, styles, attachments, links and graphs survive');
is_deeply($palette, \@palette, 'palette compression and terminal category survive');
for my $ending ("\r\n", "\r") {
    my $converted = $wire;
    $converted =~ s/\n/$ending/g;
    my ($result, $p, $r, $c) = decode($converted);
    is($result, 0, 'historical loader accepts alternate line endings');
    is_deeply([$p, $r, $c], [$parameters, $rows, $palette], 'line endings preserve decoded content');
}

open my $example_file, '<:raw', "$root/aline_011208/example/rada.aline" or die $!;
my $example = do { local $/; <$example_file> };
my ($example_code, $ep, $er, $ec) = decode($example);
is($example_code, 0, 'bundled rada project loads without Tk');
ok(@$er > 1, 'bundled project contains multiple rows');
ok((scalar grep { @{$_->{o}} } @$er) > 0, 'bundled project contains objects');
my ($round_code, $rp, $rr, $rc) = decode(savepackaline($ep, $er, $ec));
is($round_code, 0, 'bundled project saves and reloads');
is_deeply([$rp, $rr, $rc], [$ep, $er, $ec], 'bundled project retains every decoded property');

my ($s, $e) = (chr(3), chr(5));
my $header = "Aline 1.0 packed state R001\nOracle\n";
my $parameters_line = "nch${s}40\n";
my $cell_cache = "A ${s}seqnumber${s}1${s}text${s}A\n$e\n";
my $prefix = $header . $parameters_line . $cell_cache . "$e\n";
my $row = "0${s}u${s}0\n";
my $object_row = "0${s}u${s}1\n>\nA \n";
my $object_header = "0${s}1${s}u${s}u${s}u${s}u\n";
my @invalid = (
    [1, 'invalid envelope', 'not ALINE'],
    [2, 'future revision', "Aline 1.0 packed state R002\nOracle\nx"],
    [3, 'missing document data', $header],
    [4, 'missing cell cache terminator', $header . $parameters_line],
    [5, 'missing object cache terminator', $header . $parameters_line . $cell_cache],
    [6, 'short row header', $prefix . "0\n"],
    [7, 'missing row properties', $prefix . $row],
    [8, 'invalid row properties marker', $prefix . $row . "bad\n"],
    [9, 'missing cell stream', $prefix . $row . ">\n"],
    [10, 'unterminated extended key', $prefix . $row . ">\nA${e}256\n"],
    [11, 'unknown cell key', $prefix . $row . ">\nZ \n"],
    [12, 'missing explicit numbering terminator',
        $header . $parameters_line . "A ${s}seqnumber${s}2${s}text${s}A\n$e\n$e\n" . $row . ">\nA 42\n"],
    [13, 'truncated object records', $prefix . $object_row],
    [14, 'invalid object header', $prefix . $object_row . "bad\n>\n0${s}1\n"],
    [15, 'invalid object properties marker', $prefix . $object_row . $object_header . "bad\n0${s}1\n"],
    [16, 'unknown object key', $prefix . $object_row . $object_header . ">\n0${s}1\n"],
    [17, 'missing row terminator', $prefix . $row . ">\nA \n"],
);
for my $case (@invalid) {
    my ($expected, $label, $data) = @$case;
    my ($actual) = decode($data);
    is($actual, $expected, "error $expected: $label");
}

my ($registry) = $source =~ /my %objectdata=\((.*?)^\);/ms;
die 'Historical object registry not found' unless defined $registry;
my %types = $registry =~ /^\s*(\w+)\s*=>\s*\[([0-4]),/mg;
my @expected_types = qw(UpTriangle DownTriangle UpTriangleS DownTriangleS Circle
    Star Starm Square Diamond UpArrowC DownArrowC UpArrowR DownArrowR BarR
    Helix Helix2 Strand Strand2 Coil DashedLine ConnectUp ConnectDown Underline
    Box Rect BarGraph BarCGraph LineGraph LineCGraph GradGraph GradCGraph
    HSLGradGraph HSLGradCGraph OnebitGraph Text OutlineText);
is_deeply([sort keys %types], [sort @expected_types], 'all 36 registered object types are explicitly inventoried');
for my $type (@expected_types) {
    my $item = {type => $type, xpos => 2, lc => '#112233', fc => '#aabbcc', lw => 2,
        fontfill => '#334455', fontfoundry => 'Helvetica', fontwidth => 'condensed',
        fontslant => 'O', fontsize => 14, fontweight => 'Bold', fontbg => 0,
        anchor => 'nw'};
    $item->{$types{$type} == 3 ? 'text' : 'otext'} = $types{$type} == 3 ? 0.75 : 'annotation';
    my $object = {multi => 0, z => 3, rev => undef, fwd => undef, e => [$item]};
    if ($types{$type} == 3) { $object->{h} = 2; $object->{cut} = 0.5; }
    my $fixture = [{p => 0, n => undef, t => {text => '%%%Objects', attach => -1},
        e => [{text => ' '}], o => [$object]}];
    my ($result, undef, $decoded) = decode(savepackaline(\%parameters, $fixture, \@palette));
    is($result, 0, "$type loads");
    is_deeply($decoded, $fixture, "$type retains every style, payload and container property");
}

my @live = map {
    +{p => 9 - $_, n => undef, ntk => [100 + $_],
      t => {text => "Row $_", attach => $_ ? 0 : -1, tk => [200 + $_]},
      e => [{text => 'A', seqnumber => 1, xpos => 50, ypos => 60, tk => [300 + $_]}],
      o => [{multi => 1, z => 4, rev => undef, fwd => undef,
        e => [map { +{type => 'Rect', xpos => $_, fc => 'red', tk => [400 + $_]} } (1, 4)]}]}
} (0, 1);
$live[0]{o}[0]{fwd} = $live[1]{o}[0];
$live[1]{o}[0]{rev} = $live[0]{o}[0];
my (@packed_rows, @copied_rows);
_CopySeq(\@live, \@packed_rows, 1);
is_deeply($packed_rows[0]{o}[0]{fwd}, [1, 0], 'save copy converts forward pointer to array indices, not display position');
is_deeply($packed_rows[1]{o}[0]{rev}, [0, 0], 'save copy converts reverse pointer');
for my $i (0, 1) {
    ok(!exists($packed_rows[$i]{ntk}), 'save copy excludes row number handles');
    ok(!exists($packed_rows[$i]{t}{tk}), 'save copy excludes title handles');
    ok(!exists($packed_rows[$i]{e}[0]{tk}), 'save copy excludes cell handles');
    ok(!exists($packed_rows[$i]{o}[0]{e}[0]{tk}), 'save copy excludes object item handles');
    is_deeply([map { $_->{xpos} } @{$packed_rows[$i]{o}[0]{e}}], [1, 4], 'sparse region remains sparse');
}
my ($saved_code, undef, $saved_rows) = decode(savepackaline(\%parameters, \@packed_rows, \@palette));
is($saved_code, 0, 'actual save-copy output loads');
is_deeply($saved_rows, \@packed_rows, 'save-copy output preserves all persisted properties');
_CopySeq(\@live, \@copied_rows);
is($copied_rows[0]{o}[0]{fwd}, $copied_rows[1]{o}[0], 'history copy reconnects forward link within copy');
is($copied_rows[1]{o}[0]{rev}, $copied_rows[0]{o}[0], 'history copy reconnects reverse link within copy');
isnt($copied_rows[0]{o}[0], $live[0]{o}[0], 'history copy owns new object containers');
$copied_rows[0]{o}[0]{e}[0]{fc} = 'blue';
$copied_rows[0]{e}[0]{text} = 'G';
$copied_rows[0]{t}{text} = 'Edited';
is($live[0]{o}[0]{e}[0]{fc}, 'red', 'copied object edits leave source unchanged');
is($live[0]{e}[0]{text}, 'A', 'copied cell edits leave source unchanged');
is($live[0]{t}{text}, 'Row 0', 'copied title edits leave source unchanged');
is_deeply($live[0]{e}[0]{tk}, [300], 'copy does not remove live handles');
is($live[0]{o}[0]{fwd}, $live[1]{o}[0], 'copy does not replace live object links');

my $derived = [
    {p => 0, n => undef, t => {text => '%%%Numbers', attach => 2,
        pv_numspc => 10, pv_numsta => -5, pv_numdo1 => 1,
        comment => 'For Protein'}, o => [], e => [{text => '-5'}, {text => '10'}]},
    {p => 1, n => undef, t => {text => '%%%Consensus', attach => -1,
        comment => 'Groups=(!=IV), cutoffs = 0.50, 0.90'}, o => [],
        e => [map { +{text => $_} } ('a', '!', '.', '$', '%', '#')]},
    {p => 2, n => 1, t => {text => 'Protein', attach => -1}, o => [], e => [{text => 'A'}]},
];
my ($derived_code, undef, $derived_rows) = decode(savepackaline(\%parameters, $derived, \@palette));
is($derived_code, 0, 'numbering and consensus rows load');
is_deeply($derived_rows, $derived, 'private recalculation settings and non-protein annotation text survive');
open my $number_file, '<:raw', "$root/aline_011208/plugins/tAddNumbers.plugin" or die $!;
my $number_source = do { local $/; <$number_file> };
my ($context_menu) = $number_source =~ /^(sub cmbind\n\{.*?)^1;/ms;
die 'Historical numbering context menu not found' unless defined $context_menu;
our $seq = $derived_rows;
eval $context_menu;
die $@ if $@;
my @menu;
cmbind(0, 0, 0, 0, 0, undef, \@menu);
is($menu[1][0], 'Recalculate Numbers', 'reloaded numbering metadata enables historical recalculation action');
delete $derived_rows->[0]{t}{pv_numsta};
@menu = ();
cmbind(0, 0, 0, 0, 0, undef, \@menu);
is_deeply(\@menu, [], 'missing recalculation metadata disables historical action');

# These are compatibility observations, not acceptable modern validation rules.
my @tolerated = (
    ['dangling title property', $prefix . "0${s}u${s}0${s}orphan\n>\nA \n$e\n"],
    ['unconsumed cell byte', $prefix . $row . ">\nA X\n$e\n"],
);
for my $case (@tolerated) {
    my ($result, undef, $decoded) = decode($case->[1]);
    is($result, 0, "historical reader silently accepts $case->[0]");
    is(scalar @{$decoded->[0]{e}}, 1, 'ignored malformed data leaves one decoded cell');
}
my %layout = (csh => 12, csv => 14, lin => 10, all => 1, ofx => 50,
    ofy => 50, nch => 40, fsi => 1.25, num => 5, agr => 0,
    _dpl => 0, _fnx => 30, _inx => 1/30);
my ($layout_code, $layout_result) = decode(savepackaline(\%layout, [], \@palette));
is($layout_code, 0, 'all document settings and derived layout caches load');
for my $key (sort keys %layout) {
    cmp_ok(abs($layout_result->{$key} - $layout{$key}), '<', 1e-12,
        "document setting $key survives numeric serialization");
}

# PDB import produces ordinary sequence text and fractional numbering, with no
# independent persisted chain/insertion-code map.
open my $pdb_file, '<:raw', "$root/aline_011208/plugins/fInputPDB.plugin" or die $!;
my $pdb_source = do { local $/; <$pdb_file> };
my ($pdb_routine) = $pdb_source =~ /^(my \$resnl=.*)^1;/ms;
die 'Historical PDB routine not found' unless defined $pdb_routine;
our $cfg = {gapchar => '.'};
eval $pdb_routine;
die $@ if $@;
sub pdb_atom {
    my ($residue, $number, $insertion, $alternate) = @_;
    my $line = ' ' x 80;
    substr($line, 0, 6) = 'ATOM  ';
    substr($line, 12, 4) = ' CA ';
    substr($line, 16, 1) = $alternate;
    substr($line, 17, 3) = $residue;
    substr($line, 21, 1) = 'A';
    substr($line, 22, 4) = sprintf('%4d', $number);
    substr($line, 26, 1) = $insertion;
    return $line;
}
my @pdb_input = (
    pdb_atom('ALA', 1, ' ', ' '), pdb_atom('CYS', 1, 'A', ' '),
    pdb_atom('ASP', 1, 'A', 'A'), pdb_atom('GLU', 2, ' ', 'B'),
    pdb_atom('GLY', 3, ' ', ' '), 'ENDMDL', pdb_atom('TRP', 4, ' ', ' '),
);
my $pdb_import = pdbload(\@pdb_input);
is_deeply($pdb_import, [['Chain A', 'ACD.G', [1, 1.0001, 1.0002, undef, 3]]],
    'PDB insertion collisions increment fractions, gaps are unnumbered, alternate B and later models are excluded');
my @pdb_cells;
for my $i (0..length($pdb_import->[0][1])-1) {
    push @pdb_cells, {text => substr($pdb_import->[0][1], $i, 1),
        seqnumber => $pdb_import->[0][2][$i]};
}
my $pdb_rows = [{p => 0, n => undef, t => {text => $pdb_import->[0][0], attach => -1},
    e => \@pdb_cells, o => []}];
my ($pdb_code, undef, $pdb_decoded) = decode(savepackaline(\%layout, $pdb_rows, \@palette));
is($pdb_code, 0, 'PDB-derived row loads from packed state');
is_deeply($pdb_decoded, $pdb_rows, 'fractional insertion numbering survives packed persistence');

for my $fixture (qw(minimal-r001 linked-graph-r001)) {
    open my $input, '<:raw', "$root/tests/fixtures/aline/$fixture.aline" or die $!;
    my $data = do { local $/; <$input> };
    my ($result, $p, $r, $c) = decode($data);
    is($result, 0, "$fixture hand-authored file loads");
    my ($again, $p2, $r2, $c2) = decode(savepackaline($p, $r, $c));
    is($again, 0, "$fixture saves and reloads");
    is_deeply([$p2, $r2, $c2], [$p, $r, $c], "$fixture preserves every decoded value");
    if ($fixture eq 'minimal-r001') {
        is_deeply([map { $_->{seqnumber} } @{$r->[0]{e}}], [1, undef, 10],
            'minimal saved file has incremental, gap and discontinuous numbering');
    } else {
        is_deeply($r->[0]{o}[0]{fwd}, [1, 0], 'saved region links to second row');
        is_deeply([map { $_->{xpos} } @{$r->[0]{o}[0]{e}}], [0, 2], 'saved region coverage is sparse');
        is_deeply([map { $_->{text} } @{$r->[1]{o}[1]{e}}], [-0.25, 0, 1.5],
            'saved graph carries signed, zero and positive samples');
    }
}

done_testing();
