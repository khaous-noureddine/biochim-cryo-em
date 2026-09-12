use strict;
use warnings;
use FindBin;
use Test::More;

# Execute only the three serialization routines from the trusted repository
# reference. Never evaluate a project file or initialize Perl/Tk.
my $root = "$FindBin::Bin/..";
open my $source_file, '<:raw', "$root/aline_011208/bin/aline" or die $!;
my $source = do { local $/; <$source_file> };
my ($routines) = $source =~ /^(sub savepackaline\(\$\$\$\)\n\{.*?)^sub UndumpDataFile/ms;
die 'Historical serialization routines not found' unless defined $routines;
our %prog = (name => 'ALINE oracle', version => 'R001', author => 'fixture', website => 'local');
eval $routines;
die $@ if $@;

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
    {p => 7, n => 0, t => {text => 'Protein', comment => 'fixture', attach => -1},
     custom => 'row-value', e => \@cells, o => [
        {multi => 1, z => 8, rev => undef, fwd => [1, 0], e => [
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

done_testing();
